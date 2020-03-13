var Bug = {
  template:`
    <div :key="$router.fullpath" class="Bug">
        <div v-if="loading">loading... in bug screen</div>
        <div v-else-if="createBugScreen" class="content">
               <inputComponent :field="ProjectsList" id="ProjectsList.id" v-model="ProjectsList.value" :value="ProjectsList.value"></inputComponent>
               <div>
                   <inputComponent v-for="field in defaultBugFields" :field="defaultBugFieldsDetail[field]" :id="defaultBugFieldsDetail[field].id" @></inputComponent>
                   <inputComponent v-if="onProjectsSelect" v-for="field in projectDependentBugFields" :field="projectDependentBugFieldsDetail[field]" :id="projectDependentBugFieldsDetail[field].id"></inputComponent>
               </div>

               <button @click="createBug()">CreateBug</button>
        </div>
        <div v-else-if="bugDetails">
           you have successfully created bug
           <button @click="createAnotherBug()" v-text="addinUtils.getLabel('createAnotherBug')"></button>
           <button @click="$router.go(-1)" v-text="addinUtils.getLabel('close')"></button>
        </div>
    </div>
  `,
  components:{
     "inputComponent" :inputComponent,
  },
  data: function(){
     return{
         bugFieldData: {},
         loading : true,
         bugScreenVisibility: true,
         createBugScreen : false,
         bugDetails: false,
         projectDependentApiCount: 1,
         onProjectsSelect: false,
         ProjectsList:{
             display_name: "Projects",
             column_type:"picklist",
             value:"",
             options: [],
             id:"ProjectsList",
             is_mandatory: true,
         },
         defaultBugFields: ["title","description","flag","due_date"],
         projectDependentBugFields: ["assignee","bug_followers","classification_details","module_details","severity_details","priority_details"],
         customBugFields: [],
         defaultBugFieldsDetail:{
            title:{
               id: "title",
               display_name: "Issue Title",
               column_type: "singleline",
               value: "",
               options: [],
               is_mandatory: true,
            },
            description:{
               id: "description",
               display_name: "Description",
               column_type: "TextArea",
               value: "",
               options: [],
               is_mandatory: false,
            },
            flag:{
               id: "flag",
               display_name: "Flag",
               column_type: "picklist",
               value: "Internal",
               options: [{"name":"Internal","optionId":"Internal"},{"name":"External","optionId":"External"}],
               is_mandatory: false,
            },
            due_date:{
               id: "due_date",
               display_name: "Due Date",
               column_type: "date",
               value: "",
               options: [],
               is_mandatory: false,
            },
         },
         projectDependentBugFieldsDetail:{
             assignee:{
                id: "assignee",
                display_name: "Assign to",
                column_type: "picklist",
                value: "",
                options: [],
                is_mandatory: false,
             },
             bug_followers:{
                id: "bug_followers",
                display_name: "Add Followers",
                column_type: "multiSelect",
                value: [],
                options:[],
                is_mandatory:false,
             },
             classification_details:{
                id: "classification_details",
                display_name: "Classification",
                column_type: "picklist",
                value: "",
                options: [],
                is_mandatory: false,
             },
             module_details:{
                id: "module_details",
                display_name: "Module",
                column_type: "picklist",
                value: "",
                options: [],
                is_mandatory: false,
             },
             severity_details:{
                id: "severity_details",
                display_name: "Severity",
                column_type: "picklist",
                value: "",
                options: [],
                is_mandatory: false,
             },
             priority_details:{
                id: "priority_details",
                display_name: "Is it Reproducible",
                column_type: "picklist",
                value: "",
                options: [],
                is_mandatory: false,
             },

         },
         customBugFieldsDetail: {},
     }
  },
  mounted: function(){
     if(addinUtils.attachments.length > 0){
             this.defaultBugFields.push("uploaddoc");
             this.defaultBugFieldsDetail.uploaddoc = {};
             this.defaultBugFieldsDetail.uploaddoc.display_name = "Attachment";
             this.defaultBugFieldsDetail.uploaddoc.options = [];
             this.defaultBugFieldsDetail.uploaddoc.column_type = "multiSelect";
             this.defaultBugFieldsDetail.uploaddoc.value = [];
             this.defaultBugFieldsDetail.uploaddoc.id = "uploaddoc";
         for(i=0;i<addinUtils.attachments.length;i++){
             this.defaultBugFieldsDetail.uploaddoc.options.push({"name":addinUtils.attachments[i].name,"size":addinUtils.attachments[i].size,"contentType":addinUtils.attachments[i].contentType,"optionId":addinUtils.attachments[i].contentId,"contentBytes":addinUtils.attachments[i].contentBytes});
         }

     }
     this.preFillBugDetails();
     this.getAllProjects();

  },
  methods:{
      preFillBugDetails: function(){
         this.defaultBugFieldsDetail.title.value = addinUtils.mailData.subject;
         this.defaultBugFieldsDetail.description.value = addinUtils.mailData.body;
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
                  addinUtils.makeRequestToServer("GET",null,{apiMode:"bugDefaultFields",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignBugDefaultfields);
                  addinUtils.makeRequestToServer("GET",null,{apiMode:"bugCustomFields",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignCustomFields);
                  addinUtils.makeRequestToServer("GET",null,{apiMode:"projectsUsers",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignProjectUser);
              }
              console.log(project.id);
              this.ProjectsList.options.push({"name":project.name,"optionId":project.id});
           }
        }else{
        //error handling
        }
      },
      assignBugDefaultfields: function(response,responseCode,request){

         if(responseCode == 200){
            for(var i=0;i<response.response.defaultfields.classification_details.length;i++){
               var classification = response.response.defaultfields.classification_details[i];
               this.projectDependentBugFieldsDetail.classification_details.options.push({"name":classification.classification_name,"optionId":classification.classification_id});
               if(classification.isdefault){
                  this.projectDependentBugFieldsDetail.classification_details.value = classification.classification_id;
               }
            }
            for(var i=0;i<response.response.defaultfields.priority_details.length;i++){
               var priority = response.response.defaultfields.priority_details[i];
               this.projectDependentBugFieldsDetail.priority_details.options.push({"name":priority.priority_name,"optionId":priority.priority_id});
               if(priority.isdefault){
                  this.projectDependentBugFieldsDetail.priority_details.value = priority.priority_id;
               }
            }
            for(var i=0;i<response.response.defaultfields.module_details.length;i++){
               var module = response.response.defaultfields.module_details[i];
               this.projectDependentBugFieldsDetail.module_details.options.push({"name":module.module_name,"optionId":module.module_id});
               if(module.isdefault){
                  this.projectDependentBugFieldsDetail.module_details.value = module.module_id;
               }
            }
            for(var i=0;i<response.response.defaultfields.severity_details.length;i++){
               var severity = response.response.defaultfields.severity_details[i];
               this.projectDependentBugFieldsDetail.severity_details.options.push({"name":severity.severity_name,"optionId":severity.severity_id});
               if(severity.isdefault){
                  this.projectDependentBugFieldsDetail.severity_details.value = severity.severity_id;
               }
            }
            this.projectSelectApiCounts();
         }else{
           //error handling
         }
      },
      assignCustomFields: function(response,responseCode,request){
         if(responseCode == 200){
           this.projectSelectApiCounts();
         }else{
           //error handling
         }
      },
      assignProjectUser: function(response,responseCode,request){
         this.projectDependentBugFieldsDetail.assignee.options = [];
         this.projectDependentBugFieldsDetail.bug_followers.options = [];
         if(responseCode == 200){
            this.projectSelectApiCounts();
            for(var i=0;i<response.response.users.length;i++){
               var user = response.response.users[i];
               this.projectDependentBugFieldsDetail.assignee.options.push({"name":user.name,"optionId":user.id});
               this.projectDependentBugFieldsDetail.bug_followers.options.push({"name":user.name,"optionId":user.id});
            }
         }else{
           //error handling
         }
      },
      projectSelectApiCounts: function(){
         if(this.projectDependentApiCount >= 2){
            this.onProjectsSelect = true;
            this.loading = false;
            this.createBugScreen = true;
            this.projectDependentApiCount = 1;
         }else{
            this.projectDependentApiCount++;
            console.log(this.projectDependentApiCount + "countttttt");
         }

      },
      createAnotherBug: function(){
        this.loading = false;
        this.createBugScreen = true;
        this.onProjectsSelect = true;
      },
      bugCreated: function(response,responseCode,request){
        this.loading = false;
        this.bugDetails = true;
        if(responseCode == 200){
           for(var i=0;i<this.defaultBugFields.length;i++){
              var field = this.defaultBugFields[i];
               this.defaultBugFieldsDetail[field].value = "";
               if(this.defaultBugFieldsDetail[field].column_type == "multiSelect"){
                  this.defaultBugFieldsDetail[field].value = [];
               }
           }
           for(var i=0; i<this.projectDependentBugFields.length ; i++){
                var field = this.projectDependentBugFields[i];
                this.projectDependentBugFieldsDetail[field].value = "";
                if(this.projectDependentBugFieldsDetail[field].column_type == "multiSelect"){
                   this.projectDependentBugFieldsDetail[field].value = [];
                 }
           }
           for(var i=0; i<this.customBugFields.length ; i++){
               var field = this.customBugFields[i];
               this.customBugFieldsDetail[field].value = "";
               if(this.customBugFieldsDetail[field].column_type == "multiSelect"){
                   this.customBugFieldsDetail[field].value = [];
               }
           }
        }else{
           for(var i=0;i<this.defaultBugFields.length;i++){
              var field = this.defaultBugFields[i];
               this.defaultBugFieldsDetail[field].value = "";
               if(this.defaultBugFieldsDetail[field].column_type == "multiSelect"){
                  this.defaultBugFieldsDetail[field].value = [];
               }
           }
           for(var i=0; i<this.projectDependentBugFields.length ; i++){
                var field = this.projectDependentBugFields[i];
                this.projectDependentBugFieldsDetail[field].value = "";
                if(this.projectDependentBugFieldsDetail[field].column_type == "multiSelect"){
                   this.projectDependentBugFieldsDetail[field].value = [];
                 }
           }
           for(var i=0; i<this.customBugFields.length ; i++){
               var field = this.customBugFields[i];
               this.customBugFieldsDetail[field].value = "";
               if(this.customBugFieldsDetail[field].column_type == "multiSelect"){
                   this.customBugFieldsDetail[field].value = [];
               }
           }

             //error handling
        }
        this.preFillBugDetails();
      },
      createBug: function(){

        for(var i=0;i<this.defaultBugFields.length;i++){
           var field = this.defaultBugFields[i];
           if(this.defaultBugFieldsDetail[field].value != "" && this.defaultBugFieldsDetail[field].value != null && this.defaultBugFieldsDetail[field].value != undefined){
              this.bugFieldData[field] = this.defaultBugFieldsDetail[field].value;
           }
        }
        for(var i=0;i<this.projectDependentBugFields.length;i++){
           var field = this.projectDependentBugFields[i];
           if(this.projectDependentBugFieldsDetail[field].value != "" && this.projectDependentBugFieldsDetail[field].value != null && this.projectDependentBugFieldsDetail[field].value != undefined){
              if(field == "classification_details" || field == "module_details" || field == "severity_details" || field == "priority_details"){
                 var fieldArr = field.split("_");
                 fieldNameChange = fieldArr[0].concat("_id");
                 this.bugFieldData[fieldNameChange] = this.projectDependentBugFieldsDetail[field].value;
              }else{
                 this.bugFieldData[field] = this.projectDependentBugFieldsDetail[field].value;
                 if(field == "bug_followers"){
                     this.bugFieldData[field] = this.projectDependentBugFieldsDetail[field].value.toString();
                 }
              }


           }

        }

        this.loading = true;
        this.createBugScreen = false;
        console.log(JSON.stringify(this.bugFieldData));
        addinUtils.makeRequestToServer("POST",null,{apiMode:"createBug",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject  },JSON.stringify(this.bugFieldData),null,this.bugCreated);
      },
      valueChanged: function(id,value) {
         console.log(id+" valueinhome "+value+"number-1"+Number(id)-1);
         if(this.defaultBugFields.indexOf(id) > -1){
           this.defaultBugFieldsDetail[id].value = value;
         }
         if(this.projectDependentBugFields.indexOf(id) > -1){
           this.projectDependentBugFieldsDetail[id].value = value;
         }
         if(this.customBugFields.indexOf(id) > -1){
           this.customBugFieldsDetail[id].value = value;
         }
         if(id == 'ProjectsList'){
            this.loading = true;
            projectDependentApiCount = 1;
            addinUtils.currentProject = value;
            addinUtils.makeRequestToServer("GET",null,{apiMode:"bugDefaultFields",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignBugDefaultfields);
            addinUtils.makeRequestToServer("GET",null,{apiMode:"bugCustomFields",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignCustomFields);
            addinUtils.makeRequestToServer("GET",null,{apiMode:"projectsUsers",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignProjectUser);
         }

      },
      close: function(){
          console.log("Button closed");
          this.$parent.showScreen("welcomeScreen");
      },

  }
}