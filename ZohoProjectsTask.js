//1.need to add tasklist in layout,2. tasklist and owner list needs to be made only on project selection,3. should handle email_obj in task creation.


var Task = {
   name:'Task',
   template : `
      <div class="Task">
          <div v-if="loading">loading in ZohoProjects tasks</div>
          <div v-else-if="createTaskScreen" class="content">
              <inputComponent :field="ProjectsList" id="ProjectsList.id" v-model="ProjectsList.value" :value="ProjectsList.value"></inputComponent>
              <inputComponent  v-if="render" v-for="field in defaultFields" :field="defaultFieldsDetail[field]" :id="defaultFieldsDetail[field].id" @></inputComponent>
              <div v-if="!showMore" class="field more"><a href="javascript:;" @click="showMore = !showMore">Show more</a><span class="arrow"></span></div>
              <div v-if="showMore" class="field more"><a href="javascript:;" @click="showMore = !showMore">Show less</a><span class="arrow"></span></div>
                <div  v-for="section in projectDependentFields">
                  <inputComponent v-show="onProjectsSelect && showMore" v-for="field in section.fields" :field="projectDependentFieldsDetail[field]" :id="projectDependentFieldsDetail[field].id"></inputComponent>
              </div>
              <div  v-for="section in customeFields">
                  <inputComponent v-show="onProjectsSelect && showMore" v-for="field in section.fields" :field="customeFieldsDetail[field]" :id="customeFieldsDetail[field].id"></inputComponent>
              </div>

              <button @click="createTask()">CreateTask</button>
          </div>
          <div v-else-if="taskDetails" class="content">you have sucessfully created task
              <button @click="createAnotherTask()" v-text="addinUtils.getLabel('createAnotherTask')"></button>
              <button @click="$router.go(-1)" v-text="addinUtils.getLabel('close')"></button>
          </div>
      </div>
   `,
   components:{
      "inputComponent" : inputComponent,
   },
   data: function(){
      return{
               loading: true,
               createTaskScreen: false,
               onProjectsSelect: false,
               showMore: false,
               render:false,
               projectDependentApiCount: 0,
               taskFieldData: {},
               currentProject: "",
               ProjectsList:{
                  display_name: "Projects",
                  column_type:"picklist",
                  value:"",
                  options: [],
                  id:"ProjectsList",
                  is_mandatory: true,
                  error: false,
                  errorMessage: "",
               },
               usersPicklist:{},
               defaultFields:["name","description"],
               projectDependentFields:["tasklist_id","person_responsible"],
               customeFields:[],
               defaultFieldsDetail:{
                    name:{
                       id: "name",
                       display_name: "Task Name",
                       column_type: "singleline",
                       value: "",
                       options: [],
                       is_mandatory: true,
                       error: false,
                       errorMessage: "",
                    },
                    description:{
                       id: "description",
                       display_name: "Description",
                       column_type: "TextArea",
                       value: "",
                       options: [],
                       is_mandatory: false,
                       error: false,
                       errorMessage: "",
                    },
                    start_date:{
                       id: "start_date",
                       display_name: "Start Date",
                       column_type: "date",
                       value: "",
                       options: [],
                       is_mandatory: false,
                    },
                    end_date:{
                       id: "end_date",
                       display_name: "End Date",
                       column_type: "date",
                       value: "",
                       options: [],
                       is_mandatory: false,
                    },
                    priority:{
                       id: "priority",
                       display_name: "Priority",
                       column_type: "picklist",
                       value: "",
                       options: [{"name":"None","optionId":"None"},{"name":"Low","optionId":"Low"},{"name":"Medium","optionId":"Medium"},{"name":"High","optionId":"High"}],
                       is_mandatory: false,
                    },
               },
               projectDependentFieldsDetail:{
                    tasklist_id:{
                       id: "tasklist_id",
                       display_name: "Task List",
                       column_type: "picklist",
                       value: "",
                       options: [],
                       is_mandatory: false,
                    },
                    person_responsible:{
                       id: "person_responsible",
                       display_name: "Owner",
                       column_type: "multiSelect",
                       value: [],
                       options: [],
                       is_mandatory: false,
                    },
                    status_details:{
                       id: "status_details",
                       display_name: "Status",
                       column_type: "picklist",
                       value: "",
                       options:[],
                       is_mandatory: false,
                    }
               },
               customeFieldsDetail:{},

      }
   },

   beforeMount: function(){

     console.log("omg working"+Office.context.mailbox.item.itemId);
     if(addinUtils.attachments.length > 0){
             this.defaultFields.push("uploaddoc");
             this.defaultFieldsDetail.uploaddoc = {};
             this.defaultFieldsDetail.uploaddoc.display_name = "Attachment";
             this.defaultFieldsDetail.uploaddoc.options = [];
             this.defaultFieldsDetail.uploaddoc.column_type = "multiSelect";
             this.defaultFieldsDetail.uploaddoc.value = [];
             this.defaultFieldsDetail.uploaddoc.id = "uploaddoc";
           for(i=0;i<addinUtils.attachments.length;i++){
              this.defaultFieldsDetail.uploaddoc.options.push({"name":addinUtils.attachments[i].name,"size":addinUtils.attachments[i].size,"contentType":addinUtils.attachments[i].contentType,"optionId":addinUtils.attachments[i].contentId,"contentBytes":addinUtils.attachments[i].contentBytes});
           }

     }
     this.render = true;
   },

   mounted: function(){
        addinUtils.clearConsole();
        this.preFillTaskDetails();
  //      this.getAllProjects();
        this.assignProjectsOption();
        console.log(JSON.stringify(this.defaultFieldsDetail));
   },

   methods: {
      preFillTaskDetails: function(){
         this.defaultFieldsDetail.name.value = addinUtils.mailData.subject;
         this.defaultFieldsDetail.description.value = addinUtils.mailData.body;
      },
      assignProjectsOption: function(){
         this.ProjectsList.options = addinUtils.getProjectsOption(addinUtils.currentPortal);
         addinUtils.currentProject = this.ProjectsList.options[0].optionId;
         this.ProjectsList.value = addinUtils.currentProject;
         addinUtils.makeRequestToServer("GET",null,{apiMode:"projectsTaskLayout",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignProjectTaskLayout);
      },
     /* getAllProjects: function() {
         addinUtils.makeRequestToServer("GET",null,{apiMode:"allProjects",portalId:addinUtils.currentPortal},null,null,this.assignProjects);
      },*/
      createAnotherTask: function(){
         this.loading = false;
         this.createTaskScreen = true;
         this.onProjectsSelect = true;
      },
      /*assignProjects: function(response,responseCode,request) {
        //console.log(addinUtils.printJSONAsString(response.response.projects));
        if(responseCode == 200){
           for(var i=0;i<response.response.projects.length;i++){
              var project = response.response.projects[i];
              if(i==0){
                  addinUtils.currentProject = project.id;
                  this.ProjectsList.value = project.id;
                  addinUtils.makeRequestToServer("GET",null,{apiMode:"projectsTaskLayout",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignProjectTaskLayout);
                  addinUtils.makeRequestToServer("GET",null,{apiMode:"allTaskLists",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignTaskLists);
                  addinUtils.makeRequestToServer("GET",null,{apiMode:"projectsUsers",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignUsers);
              }
              console.log(project.id);
              this.ProjectsList.options.push({"name":project.name,"optionId":project.id});
           }
           if(response.response.projects.length<=0){
             //error handling
           }
        }else{
        //error handling
        }


      },*/
      assignProjectTaskLayout: function(response,responseCode,request){
        this.customeFieldsDetail = {};
        this.customeFields = [];
            console.log("where am i");
        if(responseCode == 200){
          // this.projectSelectApiCounts();
           this.loading = false;
           this.createTaskScreen = true;
           this.onProjectsSelect = true;
           var fieldsRequiredReconstructData = addinUtils.constructedFields(response,"Task","TaskLayout");
           this.projectDependentFields = fieldsRequiredReconstructData.projectDependentFields;
           this.projectDependentFieldsDetail = fieldsRequiredReconstructData.projectDependentFieldsDetail;
           this.customeFields = fieldsRequiredReconstructData.customeFields;
           this.customeFieldsDetail = fieldsRequiredReconstructData.customeFieldsDetail;
           console.log(JSON.stringify(this.projectDependentFieldsDetail)    ,this.projectDependentFields);

           /*for(var i=0;i<response.response.section_details.length;i++){
              var section = response.response.section_details[i];
             console.log(section.is_default);
              if(!section.is_default){
                 var sectionObject = {};
                 sectionObject.name = section.section_name;
                 sectionObject.fields = [];
                 for(var j=0;j<section.customfield_details.length;j++){
                    var customeField = section.customfield_details[j];
                    sectionObject.fields.push(customeField.column_name);
                    this.customeFieldsDetail[customeField.column_name]={};
                    this.customeFieldsDetail[customeField.column_name].id = customeField.column_name;
                    this.customeFieldsDetail[customeField.column_name].display_name = customeField.display_name;
                    this.customeFieldsDetail[customeField.column_name].column_type = customeField.column_type;
                    this.customeFieldsDetail[customeField.column_name].is_mandatory = customeField.is_mandatory;
                    this.customeFieldsDetail[customeField.column_name].options = [];
                    if(customeField.column_type == "picklist"){
                        for(var k=0;k<customeField.picklist_details.length;k++){
                           this.customeFieldsDetail[customeField.column_name].options.push({"name":customeField.picklist_details[k],"optionId":customeField.picklist_details[k]})
                        }
                    }else if(customeField.column_type == "userpicklist"){
                        for(var k=0;k<customeField.picklist_usermap.length;k++){
                           this.customeFieldsDetail[customeField.column_name].options.push({"name":customeField.picklist_usermap[k],"optionId":customeField.picklist_details[k]})
                        }
                    }
                    if(customeField.column_type == "multiSelect"){
                       this.customeFieldsDetail[customeField.column_name].value = [];
                       if(customeField.default_value){
                          this.customeFieldsDetail[customeField.column_name].value.push(customeField.default_value);
                       }
                    }else{
                       if(customeField.default_value){
                           this.customeFieldsDetail[customeField.column_name].value = customeField.default_value;
                       }else{
                           this.customeFieldsDetail[customeField.column_name].value = "";
                       }
                    }
                 }
                 this.customeFields.push(sectionObject);
                 console.log(JSON.stringify(this.customeFields));
              }else{
                 for(var j=0;j<section.customfield_details.length;j++){
                    var customeField = section.customfield_details[j];
                    console.log(customeField.column_name);
                    if(customeField.column_name.includes("UDF_")){
                      this.projectDependentFields.push(customeField.column_name);
                      this.projectDependentFieldsDetail[customeField.column_name]={};
                      this.projectDependentFieldsDetail[customeField.column_name].id = customeField.column_name;
                      this.projectDependentFieldsDetail[customeField.column_name].display_name = customeField.display_name;
                      this.projectDependentFieldsDetail[customeField.column_name].column_type = customeField.column_type;
                      this.projectDependentFieldsDetail[customeField.column_name].is_mandatory = customeField.is_mandatory;
                      this.projectDependentFieldsDetail[customeField.column_name].options = [];
                      if(customeField.column_type == "picklist"){
                         for(var k=0;k<customeField.picklist_details.length;k++){
                            this.projectDependentFieldsDetail[customeField.column_name].options.push({"name":customeField.picklist_details[k],"optionId":customeField.picklist_details[k]})
                         }
                      }else if(customeField.column_type == "userpicklist"){
                         for(var k=0;k<customeField.picklist_usermap.length;k++){
                            this.projectDependentFieldsDetail[customeField.column_name].options.push({"name":customeField.picklist_usermap[k],"optionId":customeField.picklist_details[k]})
                         }
                      }
                      if(customeField.column_type == "multiSelect"){
                          this.projectDependentFieldsDetail[customeField.column_name].value = [];
                          if(customeField.default_value){
                            this.projectDependentFieldsDetail[customeField.column_name].value.push(customeField.default_value);
                          }
                      }else{
                          if(customeField.default_value){
                            this.projectDependentFieldsDetail[customeField.column_name].value = customeField.default_value;
                          }else{
                            this.projectDependentFieldsDetail[customeField.column_name].value = "";
                          }

                      }
                    }
                 }
              }
           }*/

//           for(var i=0;i<response.response.status_details.length;i++){
//              var status = response.response.status_details[i];
//              this.projectDependentFieldsDetail.status_details.options.push({"name":status.name,"optionId":status.id});
//           }
           console.log(JSON.stringify(this.defaultFieldsDetail));
           console.log(this.customeFields);

        }

      },
      assignTaskLists: function(response,responseCode,request){
         /*this.projectDependentFieldsDetail.tasklist_id.options = [];
         if(responseCode == 200){
            this.projectSelectApiCounts();
            for(var i=0;i<response.response.tasklists.length;i++){
               var taskList = response.response.tasklists[i];
               this.projectDependentFieldsDetail.tasklist_id.options.push({"name":taskList.name,"optionId":taskList.id_string});
            }
         }else{
         //error handling
         }*/
        console.log(JSON.stringify(response));

      },

      assignUsers: function(response,responseCode,request){
         /*this.projectDependentFieldsDetail.person_responsible.options = [];
         if(responseCode == 200){
            console.log(JSON.stringify(response));
            this.projectSelectApiCounts();
            for(var i=0;i<response.response.users.length;i++){
               var user = response.response.users[i];
               this.usersPicklist[user.name] = user.id;
               this.projectDependentFieldsDetail.person_responsible.options.push({"name":user.name,"optionId":user.id});
            }
         }else{
         //error handling
         }*/
      },

      projectSelectApiCounts: function(){
         if(this.projectDependentApiCount >= 2){
            this.onProjectsSelect = true;
            this.loading = false;
            this.createTaskScreen = true;
            this.projectDependentApiCount = 0;
         }else{
            this.projectDependentApiCount++;
            console.log(this.projectDependentApiCount + "countttttt");
         }

      },

      createAttachmentMultipart: function(id,value){
        this.defaultFieldsDetail[id].value = value;
      },

      taskCreated: function(response,responseCode,request){
          this.loading = false;
          this.taskDetails = true;
          if(responseCode == 200){
              for(var i=0;i<this.defaultFields.length;i++){
                 var field = this.defaultFields[i];
                 this.defaultFieldsDetail[field].value = "";
                 if(this.defaultFieldsDetail[field].column_type == "multiSelect"){
                    this.defaultFieldsDetail[field].value = [];
                 }

              }
              /*for(var i=0; i<this.projectDependentFields.length ; i++){
                  var field = this.projectDependentFields[i];
                  this.projectDependentFieldsDetail[field].value = "";
                  if(this.projectDependentFieldsDetail[field].column_type == "multiSelect"){
                     this.projectDependentFieldsDetail[field].value = [];
                  }
              }
              for(var i=0; i<this.customeFields.length ; i++){
                  var field = this.customeFields[i];
                  this.customeFieldsDetail[field].value = "";
                  if(this.customeFieldsDetail[field].column_type == "multiSelect"){
                      this.customeFieldsDetail[field].value = [];
                  }
              }*/
              for(var i=0;i<this.projectDependentFields.length;i++){
                 var sectionFields = this.projectDependentFields[i].fields;
                 for(var j=0;j<sectionFields.length;j++){
                    var field = sectionFields[j];
                    this.projectDependentFieldsDetail[field].value = "";
                    if(this.projectDependentFieldsDetail[field].column_type == "multiSelect"){
                        this.projectDependentFieldsDetail[field].value = [];
                    }
                 }
              }
              for(var i=0;i<this.customeFields.length;i++){
                 var sectionFields = this.customeFields[i].fields;
                 for(var j=0;j<sectionFields.length;j++){
                    var field = sectionFields[j];
                    this.customeFieldsDetail[field].value = "";
                    if(this.customeFieldsDetail[field].column_type == "multiSelect"){
                        this.customeFieldsDetail[field].value = [];
                    }
                 }
              }
              this.preFillTaskDetails();
          }else{
            //error handling
          }
      },

      createTask: function(){
        var custom_fields = {};
        var createTaskFlag = true;
        var focusElement = "";
        for(var i=0;i<this.defaultFields.length;i++){
           var field = this.defaultFields[i];
           var validateField = addinUtils.validateField(this.defaultFieldsDetail[field]);
           if(validateField.error){
              this.defaultFieldsDetail[field].error = true;
              this.defaultFieldsDetail[field].errorMessage = validateField.message;
              console.log(JSON.stringify(this.defaultFieldsDetail[field]));
              focusElement = this.defaultFieldsDetail[field].id;
              createTaskFlag = false;
           }else{
              if(this.defaultFieldsDetail[field].value != "" && this.defaultFieldsDetail[field].value != null && this.defaultFieldsDetail[field].value != undefined){
                   var valueToBeAssigned;
                   if(this.defaultFieldsDetail[field].column_type == "multiSelect" && field != "uploaddoc"){
                      valueToBeAssigned = this.defaultFieldsDetail[field].value.toString();
                      console.log("MULTISELECT FIIELD"+field);
                   }else{
                      valueToBeAssigned = this.defaultFieldsDetail[field].value;
                      console.log("nonmultiselects  FIIELD"+field);
                   }
                   if(field.includes("UDF_")){
                      custom_fields[field] = valueToBeAssigned;
                   }else{
                       this.taskFieldData[field] = valueToBeAssigned;
                   }
              }
           }

        }

        for(var i=0;i<this.projectDependentFields.length;i++){
           var sectionFields = this.projectDependentFields[i].fields;
           for(var j=0;j<sectionFields.length;j++){
              var field = sectionFields[j];
              var validateField = addinUtils.validateField(this.projectDependentFieldsDetail[field]);
              if(validateField.error){
                 this.projectDependentFieldsDetail[field].error = true;
                 this.projectDependentFieldsDetail[field].errorMessage = validateField.message;
                 console.log(JSON.stringify(this.projectDependentFieldsDetail[field]));
                 focusElement = this.projectDependentFieldsDetail[field].id;
                 createTaskFlag = false;
              }else{
                  var valueToBeAssigned;
                  if(this.projectDependentFieldsDetail[field].column_type == "multiSelect"){
                      valueToBeAssigned = this.projectDependentFieldsDetail[field].value.toString();
                  }else{
                      valueToBeAssigned = this.projectDependentFieldsDetail[field].value;
                  }
                  if(field.includes("UDF_")){
                       custom_fields[field] = valueToBeAssigned;
                  }else{
                       this.taskFieldData[field] = valueToBeAssigned;
                  }
              }
           }
        }
        for(var i=0;i<this.customeFields.length;i++){
           var sectionFields = this.customeFields[i].fields;
           for(var j=0;j<sectionFields.length;j++){
              var field = sectionFields[j];
              var validateField =   addinUtils.validateField(this.customeFieldsDetail[field]);
              if(validateField.error){
                  this.customeFieldsDetail[field].error = true;
                  this.customeFieldsDetail[field].errorMessage = validateField.message;
                  console.log(JSON.stringify(this.customeFieldsDetail[field]));
                  focusElement = this.customeFieldsDetail[field].id;
                  createTaskFlag = false;
              }else{
                  var valueToBeAssigned;
                  if(this.customeFieldsDetail[field].column_type == "multiSelect"){
                     valueToBeAssigned = this.customeFieldsDetail[field].value.toString();
                  }else{
                     valueToBeAssigned = this.customeFieldsDetail[field].value;
                  }
                  custom_fields[field] = valueToBeAssigned;
              }
           }
        }
        this.taskFieldData.zmail_obj = {};

       /* this.taskFieldData.zmail_obj.mail_id = Office.context.mailbox.item.itemId;
        this.taskFieldData.zmail_obj.mail_type = "outlook";*/

        this.taskFieldData["custom_fields"] = custom_fields;
        if(createTaskFlag){
           this.loading = true;
           this.createTaskScreen = false;
           console.log(JSON.stringify(this.taskFieldData));
           addinUtils.makeRequestToServer("POST",null,{apiMode:"createTask",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},JSON.stringify(this.taskFieldData),null,this.taskCreated);

        }else{
           $("#" + focusElement).focus();
        }
      },

      editTask: function(){
        this.createTaskScreen = true;
        this.taskDetails = false;
      },

      valueChanged: function(id,value) {
         console.log(id+" valueinhome "+value+"number-1"+Number(id)-1);
         if(this.defaultFields.indexOf(id) > -1){
           this.defaultFieldsDetail[id].value = value;
         }
         if(this.projectDependentFields.indexOf(id) > -1){
           this.projectDependentFieldsDetail[id].value = value;
         }
         if(this.customeFields.indexOf(id) > -1){
           this.customeFieldsDetail[id].value = value;
         }
         if(id == 'ProjectsList'){
            this.loading = true;
            this.currentProject = value;
            projectDependentApiCount = 0;
            addinUtils.currentProject = value;
            addinUtils.makeRequestToServer("GET",null,{apiMode:"projectsTaskLayout",portalId:addinUtils.currentPortal,projectId:addinUtils.currentProject},null,null,this.assignProjectTaskLayout);
         }

      },
      close: function(){
          console.log("Button closed");
          this.$parent.showScreen("welcomeScreen");
      },
   },


};