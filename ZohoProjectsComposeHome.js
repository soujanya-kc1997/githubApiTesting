var ComposeHome = {
    template:
    `<section v-on:scroll="handleTodoScroll($event,'bug')" class="scroll">
        <div>
           Hi there in compose screen!!!
        </div>
        <div v-if="show.tasks" v-for="task in taskData.allTasks" @click="setSubject(task.name)">
            <div>----------------------------</div>
            <div>#{{task.id}}</div>
            <div v-text="task.name"  @click="getDetailsOfTaskOrBug('task',task.id)"></div>
            <div v-text="task.status.name" v-bind:style="{ color: task.status.color_code }" @click="getItemBody()"></div>
            <div v-if="task.is_docs_associated" @click="getProjectAttachments('task',task.id)">attachment</div>
        </div>
        <div  v-if="show.bugs" v-for="bug in bugData.allBugs" @click="setSubject(bug.title)" >
            <div>----------------------------</div>
            <div>#{{bug.id}}</div>
            <div v-text="bug.title"  @click="getDetailsOfTaskOrBug('bug',bug.id)"></div>
            <div v-text="bug.status.type" v-bind:style="{ color: bug.status.colorcode }" @click="getItemBody()"></div>
            <div v-if="bug.attachment_count>0?true:false" @click="getProjectAttachments('bug',bug.id)">attachment</div>
        </div>
    </section>
    `,
    name: "ZohoProjectsComposeHome",
    data: function(){
       return{
          portalSettings: {
              allPortals: [],
              currentPortal: {
                 name: '',
                 id: '',
                 default: false,
              },
          },
          ProjectsList:{
              display_name: "Projects",
              column_type:"picklist",
              value:"",
              options: [],
              id:"ProjectsList",
              is_mandatory: true,
          },
          show:{
              tasks: false,
              bugs: false,
          },
          taskData:{
              startIndex: 0,
              range: 20,
              allTasks:[],
          },
          bugData:{
              startIndex: 0,
              range: 20,
              allBugs:[],
          },
       }
    },
    mounted: function(){
      var conversationId = Office.context.mailbox.item.conversationId;
      console.log("conversationId: " + conversationId);
      this.checkPortalsInStorage();
      console.log("you are in compose mode");

    },
    methods:{
       testing: function(){
          console.log("click event happens");
       },
       getListingWithCriteria : function(mode,criteria){
             if(mode == "tasks"){
                addinUtils.makeRequestToServer("POST",null,{apiMode:"getAllTasks",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},criteria,null,this.assignTasks);
             }else if(mode == "bugs"){
                addinUtils.makeRequestToServer("POST",null,{apiMode:"getAllBugs",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},criteria,null,this.assignBugs);
             }
       },
       setCriteria: function(mode){
          var criteria = null;
          if(mode == "task"){
             criteria = {};
             criteria.index = this.taskData.startIndex;
             criteria.range =  this.taskData.range
             this.taskData.startIndex += 1 + this.taskData.range;
          }else if(mode == "bug"){
             criteria = {};
             criteria.index = this.bugData.startIndex;
             criteria.range =  this.bugData.range
             this.bugData.startIndex += 1 + this.bugData.range;
          }
          return criteria;
       },
       handleTodoScroll: function(event,mode) {
             console.log("scrollinngg"+mode);
             var element = event.srcElement ? event.srcElement : event.target;
           //  var containerHeight = element.scrollHeight - element.clientHeight;
           //  var scrollPercentage = element.scrollTop / containerHeight;
             if (((element.scrollHeight-element.scrollTop)<=element.clientHeight)&&element.scrollTop!=0) {
               if(mode == "bug"){
                  this.getBugListing();
               }else{
                  this.getTaskListing();
               }
             }
       },
       onListScroll: function(mode){
          console.log("onlistscrolll");
          if(mode == "task"){
             this.getTaskListing();
          }else if(mode == "bug"){
             this.getBugListing();
          }
       },
       getTaskListing: function(){
          var criteria = this.setCriteria("task");
          this.getListingWithCriteria("tasks",criteria);
       },
       getBugListing: function(){
          var criteria = this.setCriteria("bug");
          this.getListingWithCriteria("bugs",criteria);
       },
       assignTasks: function(response,responseCode,request){
          if(responseCode == 200){
              console.log("hello there!!");
              this.taskData.allTasks = response.response.tasks;
              this.show.tasks = true;
          }else{
            //handle error
          }
       },

       assignBugs:function(response,responseCode,request){
          if(responseCode == 200){
              console.log("hello there bugs!!");
              this.bugData.allBugs = response.response.bugs;
              this.show.bugs = true;
          }else{

          }
       },

       checkPortalsInStorage: function(){

          if(storageHandler.isStorageAvailable()){
              if(storageHandler.get("portals")  && storageHandler.get("portals").length>0){

              }else{

              }
          }
          this.getPortals();

       },
       getPortals: function(){
          addinUtils.makeRequestToServer("GET",null,{apiMode:"portals"},null,null,this.parsePortals);
       },
       parsePortals: function(response,responseCode,request){
          if(responseCode == 200){
             var portals = [];
             response.response.portals.forEach(function(portal){
                portals.push({name: portal.name,id: portal.id,default: portal.default});
             });
             console.log(portals);
             storageHandler.set("portals",portals);
             storageHandler.saveSettings(this.assignPortals);
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
          this.getAllProjects();
       },
       getAllProjects: function() {
          addinUtils.makeRequestToServer("GET",null,{apiMode:"allProjects",portalId:addinUtils.currentPortal},null,null,this.assignProjects);
       },
       assignProjects: function(response,responseCode,request) {
          //console.log(addinUtils.printJSONAsString(response.response.projects));
          if(responseCode == 200){
             for(var i=0;i<response.response.projects.length;i++){
                var project = response.response.projects[i];
                if(i==0){
                    addinUtils.currentProject = project.id;
                    this.ProjectsList.value = project.id;
                    var criteria = this.setCriteria("bug");
                    this.getListingWithCriteria("bugs",criteria);
                }
                console.log(project.id);
                this.ProjectsList.options.push({"name":project.name,"optionId":project.id});
             }
          }else{
          //error handling
          }
       },
       setSubject: function(subject) {
           item.subject.setAsync(
               subject,
               { asyncContext: { var1: 1, var2: 2 } },
               function (asyncResult) {
                   if (asyncResult.status == Office.AsyncResultStatus.Failed){
                      console.log("error occured");
                   }
                   else {
                       // Successfully set the subject.
                       // Do whatever appropriate for your scenario
                       // using the arguments var1 and var2 as applicable.
                   }
               });

       },
       getProjectAttachments: function(mode,id){
          if(mode == "task"){
             addinUtils.makeRequestToServer("GET",null,{apiMode:"getTaskAttachments",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject,taskId:id},null,null,this.assignTaskAttachments);
          }else{
             addinUtils.makeRequestToServer("GET",null,{apiMode:"getBugAttachments",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject,bugId:id},null,null,this.assignBugAttachments);
          }

       },
       assignTaskAttachments: function(response,responseCode,request){
           if(responseCode == 200){
              console.log("Got attachment");
           }else{

           }
       },
       assignBugAttachments: function(response,responseCode,request){
           if(responseCode == 200){
              console.log("BUG Attachment");
           }else{

           }
       },
       getDetailsOfTaskOrBug: function(mode,id){
          this.setItemBody("loading... please wait");
          if(mode == "task"){
             addinUtils.makeRequestToServer("GET",null,{apiMode:"getATask",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject,taskId:id},null,null,this.assigningTaskDetails);
          }else if(mode == "bug"){
             addinUtils.makeRequestToServer("GET",null,{apiMode:"getABug",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject,bugId:id},null,null,this.assigningBugDetails);
          }
       },
       assigningTaskDetails: function(response,responseCode,request){
          if(responseCode == 200){
             console.log("Task Details");
          }else{

          }
       },
       assigningBugDetails: function(response,responseCode,request){
          if(responseCode == 200){
             console.log("bug Details");
             var data = `<div class="composeCard"><div class="cHeader"> <span class="cIcon"><i class="bug"></i></span> <span class="cId">ZF1-I338</span> <span class="cProject">Zoho Gadgets</span></div><div class="cCont">Lorem Ipsum is simply dummy text.</div><div class="cFooter"> <span class="cAssignee"><i></i>Unassigned</span> <span class="cStatus"><i></i>Status</span> <span class="cDue"><i></i>01 Jul 2020</span> <span class="cPriority"><i></i>None</span> <span class="cComments"><i></i>2</span> <span class="cAttach"><i></i>3</span></div></div>`;
             var BodyData = response.response.bugs[0].title+"</br></br>Description:"+response.response.bugs[0].description+"</br></br>Reported Person:"+response.response.bugs[0].reported_person+"</br></br>Reporter emailId:"+response.response.bugs[0].reporter_email;
             this.setItemBody(data);
          }else{

          }
       },
       setItemBody: function(body) {
           item.body.getTypeAsync(
               function (result) {
                   if (result.status == Office.AsyncResultStatus.Failed){
                       write(result.error.message);
                   }
                   else {
                       // Successfully got the type of item body.
                       // Set data of the appropriate type in body.
                       console.log(result.value);
                       if (result.value == Office.MailboxEnums.BodyType.Html) {
                           // Body is of HTML type.
                           // Specify HTML in the coercionType parameter
                           // of setSelectedDataAsync.
                           console.log("html");
                           item.body.setAsync(
                               '<b>'+body+'</b>',
                               { coercionType: Office.CoercionType.Html,
                               asyncContext: { var3: "responsetesting", var4: 2 } },

                               function (asyncResult) {
                                   if (asyncResult.status ==
                                       Office.AsyncResultStatus.Failed){
                                       write(asyncResult.error.message);
                                   }
                                   else {
                                       console.log(asyncResult.asyncContext.var3+"heloo"+asyncResult.asyncContext.var4);
                                       console.log(asyncResult.value);
                                       // Successfully set data in item body.
                                       // Do whatever appropriate for your scenario,
                                       // using the arguments var3 and var4 as applicable.
                                   }
                               });
                       }
                       else {
                           // Body is of text type.
                            console.log("text");
                           item.body.setAsync(
                               ' Kindly note we now open 7 days a week.TEXTs',
                               { coercionType: Office.CoercionType.Text,
                                   asyncContext: { var3: 1, var4: 2 } },
                               function (asyncResult) {
                                   if (asyncResult.status ==
                                       Office.AsyncResultStatus.Failed){
                                       write(asyncResult.error.message);
                                   }
                                   else {
                                       // Successfully set data in item body.
                                       // Do whatever appropriate for your scenario,
                                       // using the arguments var3 and var4 as applicable.
                                   }
                                });
                       }
                   }
           });

       },
       getItemBody: function(){
          Office.context.mailbox.item.body.getAsync(
              "html",
              { asyncContext: "This is passed to the callback" },
              this.changesData);

       },

       changesData: function(result){
          console.log(result.value);
                            var testing = result.value;
                            if(testing.includes("<span><b>all kinds of files<br>"+"\n<br>"+"\nDescription:testing please ignore <br>"+"\n<br>"+"\nReported Person:soujanya soujanya<br>"+ "\n<br>"+ "\nReporter emailId:soujanya.kc@zohocorp.com</b></span>")){
                               testing = testing.replace("<span><b>all kinds of files<br>"+"\n<br>"+"\nDescription:testing please ignore <br>"+"\n<br>"+"\nReported Person:soujanya soujanya<br>"+ "\n<br>"+ "\nReporter emailId:soujanya.kc@zohocorp.com</b></span>","the data is changed here");
                               this.setItemBody(testing);
                            }else{
                               console.log("veralevel");
                            }

       },
    },
}