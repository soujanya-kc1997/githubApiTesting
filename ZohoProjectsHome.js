var PopUp={
   template:
   `<div class="aPopup">
       <div class="aPopupCont">
         Select Portal
       </div>
       <div class="buttons inlineAll">
            <button type="button" class="sButton">Cancel</button>
            <button type="button" class="pButton">OK</button>
       </div>
   </div>
   `,
   name: "ZohoProjectsPopUp",
   props: ["popcontent","portalList","projectsList","selectedData"],
   data: function(){
      return{

      };
   },
   components: {

   },
   mounted: function(){

   },
   methods:{

   },
};

var Home={
   template:
   `<div class="">
       <div v-if="this.show.loading">loading...of home</div>
       <div v-else-if="this.show.orgSelection" class="content">
            <inputComponent :field="this.portalSettings.allPortals" v-model="this.portalSettings.allPortals.value"></inputComponent>
            <button title="addinUtils.getLabel(continue)" v-text='addinUtils.getLabel("continue")'  @click="showScreen('welcomeScreen')"></button>
       </div>
       <div v-else-if="this.show.welcomeScreen" class="content">
            <div id="emailToProjects">
                <inputComponent v-if="show.mailContent" :field="field" ></inputComponent>
                Add as:
                <button title="addinUtils.getLabel(addTask)" v-text='addinUtils.getLabel("addTask")' @click="showScreen('taskScreen')"></button>
                <button title="addinUtils.getLabel(addBug)"  v-text='addinUtils.getLabel("addBug")' @click="showScreen('bugScreen')"></button>
            </div>
       </div>
    </div>
   `,
   name: "ZohoProjectsHome",
   components: {
      "inputComponent": inputComponent,
      "Task": Task,
      "Bug": Bug,
      "PopUp": PopUp,
   },
   data: function(){
      return {
         user: null,
         tokenData: {},
         screenArray:["loading","welcomeScreen","taskScreen","bugScreen"],
         show: {
            loading: true,
            welcomeScreen: false,
            taskScreen: false,
            bugScreen: false,
            mailContent: false,
            orgSelection: false,
         },
         portalSettings: {
             allPortals: {},
         },
         readModeLanding: {
           emailToProjects: {
              emailContent: '',
           },
         },
         field: {
             pcfid: "146000000100284",
             column_name: "PRIORITY",
             is_mandatory: false,
             is_default: true,
             display_name: "Email to Projects",
             column_type: "TextArea",
             value: "",
             options: [],
             error:false    ,
             errorMessage:"",

         },
         writeModeLanding: {

         },

      };
   },
   mounted: function(){
          this.initialize();
           try{
               Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, this.initialize);

           }catch(err){
               addinUtils.printJSONAsString(err);
           }

   },
   methods: {
      initialize: function() {
         Office.context.mailbox.getCallbackTokenAsync(this.getItem);
         if(outlookVariables.jwt){
            this.checkPortalsInStorage();
         }else{
             Office.context.mailbox.getUserIdentityTokenAsync(this.parseJwToken);
         }
      },
      getItemRestId:function() {
        if (Office.context.mailbox.diagnostics.hostName === 'OutlookIOS') {
          // itemId is already REST-formatted
          return Office.context.mailbox.item.itemId;
        } else {
          // Convert to an item ID for API v2.0
          return Office.context.mailbox.convertToRestId(
            Office.context.mailbox.item.itemId,
            Office.MailboxEnums.RestVersion.v2_0
          );
        }
      },
      getItem:function(data,mode){
           var callback = null;
           if(mode === "getAttachment"){
              addinUtils.attachments = [];
              this.url=Office.context.mailbox.restUrl+"/v2.0/me/messages/"+this.getItemRestId()+"/attachments";
              callback = this.getAttachment;
           } else {
              this.url=Office.context.mailbox.restUrl+"/v2.0/me/messages/"+this.getItemRestId();
              this.tokenData = data;
              callback = this.getMailContent;
              this.token=data.value;
           }

           console.log(this.token+"token to get data");
           var xmlHttp = new XMLHttpRequest();
           xmlHttp.onreadystatechange = function() {
               if (xmlHttp.readyState == 4) {
                   callback(JSON.parse(xmlHttp.response), xmlHttp.status);
               }
           };
           xmlHttp.open("GET", this.url, true);
           xmlHttp.setRequestHeader("Authorization","Bearer " + this.token);
           xmlHttp.send(null);
      },
      getAttachment:function(response,status){
         if(status==200){
           //console.log(JSON.stringify(response));
           for(var i in response.value){
             var name=response.value[i].Name;
               addinUtils.attachments.push({selected:false,contentType:response.value[i].ContentType,name:name,contentBytes:response.value[i].ContentBytes,contentId:response.value[i].ContentId,size:response.value[i].Size});
           }
           this.show.mailContent = true;
         }else{
           //handle error
         }
       },
      getMailContent:function(item){
         console.log(JSON.stringify(item));
         addinUtils.mailData.subject = item.Subject;
         addinUtils.mailData.body = item.BodyPreview;
         addinUtils.mailData.ConversationId = item.ConversationId;
         this.field.value = item.Subject + "\r\n\r\n" + item.BodyPreview;
         this.getItem(this.tokenData,"getAttachment");
         if(item.HasAttachments){
          // this.getItem(this.tokenData,"getAttachment");
         }else{
           this.show.mailContent = true;
         }

         console.log(item.subject +"\r\n\r\n"+item.BodyPreview);
         console.log(JSON.stringify(item));
      },
      parseJwToken: function(result) {
         outlookVariables.jwt =  result.value;
         this.checkPortalsInStorage();
      },
      checkPortalsInStorage: function(){
         if(storageHandler.isStorageAvailable()){
             var currentPortal = storageHandler.get("portal");
             currentPortal?(addinUtils.setCurrentPortal(currentPortal),this.showScreen("welcomeScreen")):undefined;
         }
         this.getPortals();
      },
      getPortals: function(){
         addinUtils.makeRequestToServer("GET",null,{apiMode:"portals"},null,null,this.parsePortals);
         //this.parsePortals("{}",200,null);
      },
      parsePortals: function(response,responseCode,request){
         console.log("yoo");
         response = JSON.parse('{"code":200,"response":{"login_id":"6127453","portals":[{"trial_enabled":false,"gmt_time_zone":"(GMT 5:30) India Standard Time","project_count":{"active":2},"role":"admin","is_sprints_integrated":false,"avail_user_count":1023,"is_crm_partner":false,"link":{"project":{"url":"https://projects.csez.zohocorpin.com/restapi/portal/14079918/projects/"}},"bug_plan":"Enterprise","locale":{"country":"United States","code":"en_US","language":"English"},"layouts":{"projects":{"module_id":"146000000003005"},"tasks":{"module_id":"146000000000272"}},"new_user_plan":true,"available_projects":-1,"default":false,"id":14079918,"bug_plural":"Issues","is_new_plan":false,"plan":"Enterprise","percentage_calculation":"based_on_status","settings":{"business_hours":{"business_end":1440,"business_start":0},"default_dependency_type":"finish-start","working_days":["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],"timelog_period":{"log_future_time":{"allowed":false},"log_past_time":{"allowed":true}},"time_zone":"Asia/Kolkata","startday_of_week":"sunday","task_date_format":"MM-dd-yyyy","timesheet":{"is_timesheet_approval_enabled":false,"default_billing_status":"Billable"},"holidays":[],"is_budget_enabled":false,"company_name":"Projects add-in","date_format":"MM-dd-yyyy hh:mm aaa","has_budget_permission":true},"sprints_project_permission":false,"is_display_taskprefix":true,"bug_singular":"Issue","is_display_projectprefix":true,"project_prefix":"PR-","max_user_count":1025,"extensions":{"locations":{"taskdetails_rightpanel":"146000000038091","app_settings":"146000000011161","issuedetails_rightpanel":"146000000038093","issue_tab":"146000000011165","task_tab":"146000000011163","attachment_picker":"146000000011171","top_band":"146000000011169","project_tab":"146000000011167"}},"profile_id":146000000011320,"name":"projectsaddin","id_string":"14079918","is_time_log_restriction_enabled":false},{"trial_enabled":false,"gmt_time_zone":"(GMT 5:30) India Standard Time","project_count":{"active":2},"role":"admin","is_sprints_integrated":false,"avail_user_count":1023,"is_crm_partner":false,"link":{"project":{"url":"https://projects.csez.zohocorpin.com/restapi/portal/14079918/projects/"}},"bug_plan":"Enterprise","locale":{"country":"United States","code":"en_US","language":"English"},"layouts":{"projects":{"module_id":"146000000003005"},"tasks":{"module_id":"146000000000272"}},"new_user_plan":true,"available_projects":-1,"default":true,"id":14079919,"bug_plural":"Issues","is_new_plan":false,"plan":"Enterprise","percentage_calculation":"based_on_status","settings":{"business_hours":{"business_end":1440,"business_start":0},"default_dependency_type":"finish-start","working_days":["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],"timelog_period":{"log_future_time":{"allowed":false},"log_past_time":{"allowed":true}},"time_zone":"Asia/Kolkata","startday_of_week":"sunday","task_date_format":"MM-dd-yyyy","timesheet":{"is_timesheet_approval_enabled":false,"default_billing_status":"Billable"},"holidays":[],"is_budget_enabled":false,"company_name":"Projects add-in","date_format":"MM-dd-yyyy hh:mm aaa","has_budget_permission":true},"sprints_project_permission":false,"is_display_taskprefix":true,"bug_singular":"Issue","is_display_projectprefix":true,"project_prefix":"PR-","max_user_count":1025,"extensions":{"locations":{"taskdetails_rightpanel":"146000000038091","app_settings":"146000000011161","issuedetails_rightpanel":"146000000038093","issue_tab":"146000000011165","task_tab":"146000000011163","attachment_picker":"146000000011171","top_band":"146000000011169","project_tab":"146000000011167"}},"profile_id":146000000011320,"name":"soujiProjects","id_string":"14079919","is_time_log_restriction_enabled":false}]},"response_type":"gadgets","request_uri":"/api/office365/v1/addin","status":"success"}');
         if(responseCode == 200){
            this.portalSettings.allPortals=fieldConstruction.constructFieldToRender(response.response.portals,"portals");
            console.log(this.portalSettings.allPortals.value+"8989");
            if(addinUtils.currentPortal != undefined && addinUtils.currentPortal != null && addinUtils.currentPortal != "" ){
              this.portalSettings.allPortals.value = addinUtils.currentPortal;
            }else{
              this.showScreen("orgSelection");
            }
         }else{
         //error handling
         }
      },
      assignPortals: function() {
         this.portalSettings.allPortals = storageHandler.get("portals");
         if(this.portalSettings.allPortals){
             var defaultPortalSet = false;
             var currentPortal = {};
             for(var i=0 ; i<this.portalSettings.allPortals.length ; i++){
                 var portal = this.portalSettings.allPortals[i];
                 if(portal.default){
                    defaultPortalSet = true;
                    currentPortal = {name: portal.name,id: portal.id,default: portal.default}
                    addinUtils.setCurrentPortal(portal.id);
                 }
                 if(!defaultPortalSet){
                    currentPortal={name:portal.name,id:portal.id,default:portal.default};
                 }
             }
             this.portalSettings.currentPortal=currentPortal;
         }else{
             //handle error
         }
         this.getEmailBody();
      },

      getEmailBody: function() {
        this.readModeLanding.emailToProjects.emailContent = Office.context.mailbox.item.subject;
        this.showScreen("welcomeScreen");
      },

      convertEmail: function(result){
         this.readModeLanding.emailToProjects.emailContent= result.value;
         this.showScreen("welcomeScreen");
      },

      showScreen: function(displayScreen){
          if(displayScreen == "taskScreen" || displayScreen == "bugScreen"){
            displayScreen==="taskScreen"?router.push({path:"/task"}):router.push({path:"/bug"});
          }else{
            this.show[displayScreen]=true;
            displayScreen ==="welcomeScreen"?(this.show.welcomeScreen = true,this.show.loading = false,this.show.orgSelection = false):(displayScreen ==="orgSelection"?(this.show.orgSelection = true,this.show.loading = false,this.show.welcomeScreen = false):undefined);
          }
      },

      valueChanged: function(id,value) {
          console.log(this.portalSettings.allPortals);
          if(id == "portals"){
              console.log(id,value);
              this.portalSettings.allPortals.value = value;
              addinUtils.setCurrentPortal(value);
          }
      },

   },
};


