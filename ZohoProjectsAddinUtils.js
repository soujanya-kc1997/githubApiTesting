var storage;

var addinUtils = {
  language: null,
  projectsUrl: null,
  currentPortal:null,
  currentProject:null,
  mailData:{},
  attachments:[],
  portals:[],
  projects:{},
  projectsUser:{},
  projectsTaskList:{},
  projectsTaskLayout:{},
  getLabel: function(value){
     var returnLabel = '';
     language = addinUtils.language;
     if (language == null || language == undefined || language == ''){
       language = "en_US";
     }
     if(value !== null && value !== undefined && value !== ''){
       returnLabel = label[language][value];
       if(returnLabel === null && returnLabel === undefined && returnLabel ===''){
          returnLabel ="--label--";
          console.log(value);
       }
     }
     return returnLabel;
  },
  setCurrentPortal: function(portalId,callback){
     addinUtils.currentPortal = portalId;
     addinUtils.getAllProjects();
     storageHandler.set("portal",portalId);
     storageHandler.saveSettings(callback);
  },
  setLanguage: function(lang){
     addinUtils.language = lang;
  },
  setProjectsUrl: function(projectsUrl){
     addinUtils.projectsUrl = projectsUrl;
  },
  setUser: function(user){
     addinUtils.user = user;
  },
  openAccounts: function(){
     addinUtils.openExternalWindow(outlookVariable.accountsUrl);
  },
  openZohoProjects: function() {
     addinUtils.openExternalWindow(this.projectsUrl, 'popUpWindow');
  },
  openExternalWindow: function(url) {
     window.open(url, 'popUpWindow');
  },
  makeRequestToServer: function(mode, url, params, body, headers, callback) {
     url = outlookVariables.gadgets_dc_url + "/api/office365/v1/addin";
     outlookCommonUtil.makeHTTPRequest(mode, url, params, body, headers, callback);
  },
  clearConsole: function() {
     if (typeof console._commandLineAPI !== 'undefined') {
       console.API = console._commandLineAPI;
     } else if (typeof console._inspectorCommandLineAPI !== 'undefined') {
       console.API = console._inspectorCommandLineAPI;
     } else if (typeof console.clear !== 'undefined') {
       console.API = console;
     }
     console.API.clear();
  },
  printJSONAsString:function(json){
     console.log(JSON.stringify(json))
  },
  getAllProjects:function(){
     console.log("in get projects");
     this.makeRequestToServer("GET",null,{apiMode:"allProjects",portalId:addinUtils.currentPortal},null,null,this.assignProjects);
  },
  assignProjects:function(response,responseCode,request){
     console.log("in assignProjects");
     if (responseCode == 200){
        var projectsPortal = response.response.portalId;
        addinUtils.projects[projectsPortal]=[];
        addinUtils.projects[projectsPortal] = response.response.projects;
        for(var i=0;i<response.response.projects.length;i++){
          var project = response.response.projects[i];
          addinUtils.makeRequestToServer("GET",null,{apiMode:"projectsUsers",portalId:addinUtils.currentPortal,projectId:project.id},null,null,addinUtils.assignProjectsUser);
          addinUtils.makeRequestToServer("GET",null,{apiMode:"allTaskLists",portalId:addinUtils.currentPortal,projectId:project.id},null,null,addinUtils.assignProjectsTaskList);
        }
        if(response.response.projects.length<=0){
         //error handling
        }
     }else{
       /*handle error*/
     }
  },
  assignProjectsUser:function(response,responseCode,request){
      console.log("what bha whats you problem"+JSON.stringify(response));
      addinUtils.projectsUser
      if (responseCode == 200){
               console.log(response.response.projectId);
               addinUtils.projectsUser[response.response.projectId]=response.response.users;
      }
  },
  assignProjectsTaskList:function(response,responseCode,request){
      if (responseCode == 200){
           console.log(response.response.projectId);
           addinUtils.projectsTaskList[response.response.projectId]=response.response.tasklists;
      }
  },
  getProjectsUser:function(){

  },
  getProjectsOption: function(portalId){
      var projectsArrayOptions = [];
      var portalProjectsArray = addinUtils.projects[portalId];
      for(var i=0; i<portalProjectsArray.length; i++){
         projectsArrayOptions.push({"name":portalProjectsArray[i].name,"optionId":portalProjectsArray[i].id});
      }
      return projectsArrayOptions;
  },
  getUsersOption: function(projectId){
      var userArrayOptions = [];
      var projectUserArray = addinUtils.projectsUser[projectId];
      for(var i=0; i<projectUserArray.length; i++){
         userArrayOptions.push({"name":projectUserArray[i].name,"optionId":projectUserArray[i].id})
      }
      return userArrayOptions;
  },
  getTaskListsOption: function(projectId){
      var taskListOptions = [];
      var projectsTaskList = addinUtils.projectsTaskList[projectId];
      for(var i=0; i<projectsTaskList.length; i++){
          taskListOptions.push({"name":projectsTaskList[i].name,"optionId":projectsTaskList[i].id});
      }
      return taskListOptions;
  },

  validateField:function(field){
     var error = false;
     var message = "";
     console.log(field,field.is_mandatory);
     if(field.is_mandatory === true){
        if (field.value === null || field.value === undefined || (field.value && field.value.length===0)) {
            console.log("value empty");
            error = true;
            message = field.display_name + " " + addinUtils.getLabel("fieldMandatory");
        }else if ((field.column_type == "TextArea" || field.column_type == "singleline" || field.column_type == "phone" || field.column_type == "int" || field.column_type == "text") && field.value === '' && field.value !== null) {
            error = true;
            message = field.display_name + " " + addinUtils.getLabel("cannotBeEmpty");
        }
     }
     if(field.value){
        if(field.column_type=="email"){
             error = !(new RegExp(/^[a-zA-Z0-9_]([\w\-\.\+\']*)@([\w\-\.]*)(\.[a-zA-Z]{2,22}(\.[a-zA-Z]{2}){0,2})$/).test(field.value));
             message = addinUtils.getLabel("incorrectValue");
        }else if(field.column_type=="url"){
              error = !(new RegExp( /^(http:\/\/www.|https:\/\/www.|ftp:\/\/www.|www.|http:\/\/|https:\/\/|ftp:\/\/|){1}[^- "-,.-/:-@[-^`{-]+(\.[^- "$-,.-/<->@[-^`{-]+)+(\[^- "(-)<>^{-}]*)*$/).test(field.value));
              message = addinUtils.getLabel("incorrectValue");
        }else if(field.column_type=="phone"){
             error = !(new RegExp(/^([\+]?)(?![\.-])((?=([ \.-]?[\da-zA-Z]+))\3+|([ ]?\((?![\.-])(?=[ \.-]?[\da-zA-Z]+)([ \.-]?[\da-zA-Z]+)+\)(?!-)([ \.-][\da-zA-Z]+)?)+)+([;,][\da-zA-Z]+)?$/).test(field.value));
             message = addinUtils.getLabel("incorrectValue");
        }else if(field.column_type=="date"){
             error = !(new RegExp(/^(1[0-2]|0[1-9])-(3[01]|[12][0-9]|0[1-9])-[0-9]{4}$/).test(field.value));
             message = addinUtils.getLabel("incorrectValue");
        }
     }
     console.log(error,message,field.id);
     return {error:error,message:message,id:field.id}
  },

  constructedFields: function(response,module,apiType){
    // response =JSON.parse('{"code":200,"response":{"layout_id":"146000000000278","section_details":[{"section_id":"146000000000281","section_name":"Task Information","customfield_details":[{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000284","column_name":"LOGINNAME","is_mandatory":false,"is_default":true,"display_name":"Owner","column_type":"userpicklist"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000287","column_name":"CUSTOM_STATUSID","is_mandatory":false,"is_default":true,"display_name":"Status","column_type":"picklist"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000290","column_name":"TODODUEDATE","is_mandatory":false,"is_default":true,"display_name":"StartDate","column_type":"date"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000293","column_name":"TODOENDDATE","is_mandatory":false,"is_default":true,"display_name":"DueDate","column_type":"date"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028796","column_name":"UDF_CHAR9","is_mandatory":false,"is_default":false,"display_name":"url field","column_type":"url"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000296","column_name":"DURATION","is_mandatory":false,"is_default":true,"display_name":"Duration","column_type":"singleline"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000299","column_name":"PRIORITY","is_mandatory":false,"is_default":true,"display_name":"Priority","column_type":"picklist"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000302","column_name":"PERCENTCOMPLETE","is_mandatory":false,"is_default":true,"display_name":"Percentcomplete","column_type":"singleline"},{"picklist_details":["6127453"],"picklist_usermap":["soujanya soujanya"],"is_pii":false,"is_encrypted":false,"pcfid":"146000000028708","column_name":"UDF_USER4","is_mandatory":false,"is_default":false,"display_name":"second user picklist field","column_type":"userpicklist"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028620","column_name":"UDF_CHAR1","default_value":"testing value","is_mandatory":false,"is_default":false,"display_name":"singlelinecustome field","column_type":"singleline"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028806","column_name":"UDF_TEXT2","is_mandatory":false,"is_default":false,"display_name":"second formula field","column_type":"formula"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028808","column_name":"UDF_CHAR10","is_mandatory":false,"is_default":false,"display_name":"phone number testing field","column_type":"phone"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028792","column_name":"UDF_DATE4","is_mandatory":false,"is_default":false,"display_name":"formula field","column_type":"formula"},{"picklist_details":["picklist2","picklist3","picklist1"],"picklist_usermap":[],"is_pii":false,"is_encrypted":false,"pcfid":"146000000028672","column_name":"UDF_CHAR7","default_value":"picklist2","is_mandatory":false,"is_default":false,"display_name":"picklist testing field","column_type":"picklist"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028676","column_name":"UDF_DATE3","is_mandatory":false,"is_default":false,"display_name":"date field testing","column_type":"date"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028670","column_name":"UDF_CHAR6","is_mandatory":false,"is_default":false,"display_name":"Phone testing field","column_type":"phone"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028678","column_name":"UDF_LONG1","default_value":"97979","is_mandatory":false,"is_default":false,"display_name":"Number field testing","column_type":"int"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028680","column_name":"UDF_CHAR8","default_value":"example@zoho.com","is_mandatory":false,"is_default":false,"display_name":"Email field testing","column_type":"email"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000308","column_name":"TAGS","is_mandatory":false,"is_default":true,"display_name":"zp.tag.tags1","column_type":"singleline"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000311","column_name":"ISREMINDERSET","is_mandatory":false,"is_default":true,"display_name":"zp.general.reminder","column_type":"picklist"},{"is_pii":false,"is_encrypted":false,"pcfid":"146000000000314","column_name":"ISRECURRINGSET","is_mandatory":false,"is_default":true,"display_name":"zp.events.recurring","column_type":"picklist"}],"is_default":true},{"section_id":"146000000028624","section_name":"Custom Section Name","customfield_details":[{"is_pii":false,"is_encrypted":false,"pcfid":"146000000028626","column_name":"UDF_CHAR2","default_value":"testing","is_mandatory":false,"is_default":false,"display_name":"Custom Section SingleLine field","column_type":"singleline"},{"picklist_details":["picklist1","picklist2"],"picklist_usermap":[],"is_pii":false,"is_encrypted":false,"pcfid":"146000000028628","column_name":"UDF_CHAR3","default_value":"picklist1","is_mandatory":false,"is_default":false,"display_name":"Custom Layout Picklist Section","column_type":"picklist"},{"picklist_details":["6127453"],"picklist_usermap":["soujanya soujanya"],"is_pii":false,"is_encrypted":false,"pcfid":"146000000028630","column_name":"UDF_USER1","is_mandatory":false,"is_default":false,"display_name":"User Picklist Custom field","column_type":"userpicklist"}],"is_default":false}],"status_details":[{"is_start":true,"color":"#eb5768","name":"Open","id":"146000000000335","is_default":true,"type":"open"},{"is_start":false,"color":"#8eb15a","name":"Closed","id":"146000000000338","is_default":true,"type":"closed"}]},"response_type":"gadgets","request_uri":"/api/office365/v1/addin","status":"success"}');

     if(module === "Task" && apiType === "TaskLayout"){
        omittedColumnNames=["CUSTOM_STATUSID","DURATION","PERCENTCOMPLETE","TAGS","ISREMINDERSET","ISRECURRINGSET"];
        columnNameChanges={
           "LOGINNAME":"person_responsible",
           "TODODUEDATE":"start_date",
           "TODOENDDATE":"end_date",
           "PRIORITY":"priority",

        };
        var taskLayoutProject = response.response.projectId;
        console.log(taskLayoutProject+"*************");
        fieldsRequiredReconstructData = {};
        fieldsRequiredReconstructData.projectDependentFields =[];
        fieldsRequiredReconstructData.customeFields =[];
        fieldsRequiredReconstructData.projectDependentFieldsDetail ={};
        fieldsRequiredReconstructData.customeFieldsDetail ={};
        for(var i=0;i<response.response.section_details.length;i++){
           var section = response.response.section_details[i];
           if(section.is_default){
              var sectionObject = {};
              sectionObject.name = section.section_name;
              sectionObject.fields = [];
              for(var j=0;j<section.customfield_details.length;j++){
                 var customeField = section.customfield_details[j];
                 var correctColumnName = (columnNameChanges[customeField.column_name])?columnNameChanges[customeField.column_name]:customeField.column_name;
                 if(!omittedColumnNames.includes(correctColumnName)){
                   sectionObject.fields.push(correctColumnName);
                 }
                 fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName]=customeField;
                 fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].id=correctColumnName;
                 fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].options=[];
                 fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].value="";
                 fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].error=false;
                 fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].errorMessage="";
                 if(customeField.column_type == "picklist"){
                    if(correctColumnName == "priority"){
                       fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].options= [{"name":"None","optionId":"None"},{"name":"Low","optionId":"Low"},{"name":"Medium","optionId":"Medium"},{"name":"High","optionId":"High"}];
                    }else{

                       for(var k=0;customeField.picklist_details&&k<customeField.picklist_details.length;k++){
                          fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].options.push({"name":customeField.picklist_details[k],"optionId":customeField.picklist_details[k]})
                       }
                    }
                 }
                 if(customeField.column_type == "userpicklist"){
                      if(customeField.picklist_usermap){
                         for(var k=0;k<customeField.picklist_usermap.length;k++){
                           fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].options.push({"name":customeField.picklist_usermap[k],"optionId":customeField.picklist_details[k]})
                         }
                      }else{
                         fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].options = addinUtils.getUsersOption(taskLayoutProject);
                      }
                 }
                 if(customeField.default_value){
                    fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].value = customeField.default_value;
                 }else{
                    fieldsRequiredReconstructData.projectDependentFieldsDetail[correctColumnName].value = "";
                 }

              }
             fieldsRequiredReconstructData.projectDependentFields.push(sectionObject);
           }else{
                 var sectionObject = {};
                 sectionObject.name = section.section_name;
                 sectionObject.fields = [];
                 for(var j=0;j<section.customfield_details.length;j++){
                    var customeField = section.customfield_details[j];
                    sectionObject.fields.push(customeField.column_name);
                    fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name]=customeField;
                    fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].id = customeField.column_name;
                    fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].options = [];
                    fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].error = false;
                    fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].errorMessage = "";
                    if(customeField.column_type == "picklist"){
                        for(var k=0;k<customeField.picklist_details.length;k++){
                           fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].options.push({"name":customeField.picklist_details[k],"optionId":customeField.picklist_details[k]})
                        }
                    }else if(customeField.column_type == "userpicklist"){
                        for(var k=0;k<customeField.picklist_usermap.length;k++){
                           fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].options.push({"name":customeField.picklist_usermap[k],"optionId":customeField.picklist_details[k]})
                        }
                    }
                    if(customeField.column_type == "multiSelect"){
                       fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].value = [];
                       if(customeField.default_value){
                          fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].value.push(customeField.default_value);
                       }
                    }else{
                       if(customeField.default_value){
                           fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].value = customeField.default_value;
                       }else{
                           fieldsRequiredReconstructData.customeFieldsDetail[customeField.column_name].value = "";
                       }
                    }
                 }
                 fieldsRequiredReconstructData.customeFields.push(sectionObject);
           }
        }
        console.log(JSON.stringify(fieldsRequiredReconstructData));
      return fieldsRequiredReconstructData;
     }
  }
};



var fieldConstruction ={
   constructFieldToRender: function(datas,module){
      constructedFields = [];
      if(module == "portals"){
         var constructedField = {};
         constructedField.id = "portals";
         constructedField.column_type = "picklist";
         constructedField.value = "";
         constructedField.options = [];
         datas.forEach(function(data){
           constructedField.value = (constructedField.value) ?(data.default === true? data.id : constructedField.value):data.id;
           constructedField.options.push({"name": data.name,"optionId": data.id});
         });
         console.log(JSON.stringify(constructedField)+"ppp");
         return constructedField;
      }

   },

};

var storageHandler = {
  isStorageAvailable: function() {
     console.log(JSON.stringify(roamingSettings)+"*******");
     storage = roamingSettings.get("data");
     console.log(JSON.stringify(storage)+"@@@@@@@@@@@@@@@@@@@");
     return (storage !== null && storage !== undefined && storage !== '');
  },
  get: function(value){
     return storage[value];
  },
  set: function(key , value){
     if(storage === null || storage === undefined){
        storage = {};
     }
     storage[key] = value;
  },
  remove: function(value){
     if(storage[value]){
       delete storage[value];
     }
  },
  saveSettings: function(callback){
      roamingSettings.set("data",storage);
      if(callback){
         roamingSettings.saveAsync(callback);
      }else{
         roamingSettings.saveAsync(storageHandler.resultFunction);
      }
  },
  deleteData: function(callback){
     storage = null;
     roamingSettings.set("data", storage);
     roamingSettings.remove("data");
     this.saveSettings(callback);
     try {
       if (roamingSettings._settingsData$p$0) {
         for (var key in roamingSettings._rawData$p$0) {
           roamingSettings.remove(key);
         }
       }
       if (roamingSettings._settingsData$p$0) {
         for (var key in roamingSettings._settingsData$p$0) {
           roamingSettings.remove(key);
         }
       }
       this.saveSettings();
     } catch (error) {
       this.saveSettings();
     }
  },
  resultFunction: function(result){
     if(result.status!="succeeded"){
        addinUtils.printJSONAsString(result);
     }
  },

};