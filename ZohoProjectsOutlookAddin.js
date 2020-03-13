var zohoProjectsApp;
var roamingSettings;
var pop = null;


var Login = {
  template:`
     <div :key="$route.fullPath">
        <div v-if="loading">loading...</div>
        <div v-else>
          <button :title="addinUtils.getLabel(buttonLabel)" v-text="addinUtils.getLabel(buttonLabel)" @click="buttonAction"></button>
          <button :title="addinUtils.getLabel(linkLabel)" v-text="addinUtils.getLabel(linkLabel)" @click="linkAction"></button>
        </div>
     </div>
  `,
  name:"LoginScreen",
  data:function(){
    return {
       mode: '',
       loading: true,
       message: 'loginText',
       buttonLabel: 'login',
       linkLabel: 'signup',
    };
  },
  mounted: function(){
     this.loading = true;

//     outlookCommonUtil.makeHTTPRequest("GET","https://projects.csez.zohocorpin.com/restapi/portal/14079918/projects/146000000013005/bugs/defaultfields/",{"ticket":"6127453-fa828b0b-8649af72de729deb8b147527537fdbd6"},null,null,this.testing);
     outlookLoginUtils.isLoggedInBrowser(this.checkLoginInBrowser);
  },
  methods: {
      testing: function(response){
        console.log(response);
      },
      checkLoginInBrowser: function(isLogged, response) {
         if(isLogged){
            this.mode = "logged";
            this.userEmail = response.userEmail;
            this.message = 'loggedInText';
            this.buttonLabel = 'continue';
            this.linkLabel = 'userAnotherAccount';
         } else {
            this.mode = "login";
            this.message = 'loginText';
            this.buttonLabel = 'login';
            this.linkLabel = 'signup';
         }
         this.loading = false;
      },
      buttonAction: function() {
         this.loading = true;
         if(this.mode == "login" || this.mode == "continue") {
            outlookLoginUtils.openLoginUrl(this.afterLogin);
         } else if(this.mode == 'logged') {
            outlookLoginUtils.addOauthToken(this.afterLogin);
         } else if(this.mode == 'reload') {
            router.push({
               path: "/app"
            });
         }
      },
      linkAction: function() {
         this.loading = true;
         if(this.mode == "login") {
            outlookLoginUtils.zohoSignup(this.afterLogin);
         }else if(this.mode == "logged") {
            outlookLoginUtils.loginWithAnotherAccount(this.afterLogin);
         }
      },
      afterLogin: function() {
         this.loop = 0;
         clearInterval(this.loginIntervalId);
         this.loginIntervalId = setInterval(this.checkWindow, 10000);
      },
      checkWindow: function() {
         outlookLoginUtils.hasCredentialsInDb(this.checkLoginInDb);
      },
      checkLoginInDb: function(result) {
         if(result) {
            clearInterval(this.loginIntervalId);
            router.push({
              path: "/home",
            });
         }else {
             this.loop += 1;
             if(this.loop > 1000) {
                this.mode = "reload";
                this.message = "refreshText";
                this.buttonLabel = "reload";
                this.loading = "false";
             } else {
                if(pop && pop.closed) {
                   this.mode = "login";
                   this.message = "loginText";
                   this.buttonLabel = "login";
                   this.linkLabel = "signup";
                   this.loading = false;
                }
             }

         }
      },
  },
};

var ZohoProjects = {
  template:`
      <div class="cForm">
          <div v-if="show.loading">loading...</div>
          <div class="header"><div class="hfCont">Header content goes here</div></div>
          <router-view></router-view>
          <div class="footer">
              footer content goes here
          </div>
      </div>
  `,
  name: "ZohoProjects",
  data: function() {
     return{
        show: {
           loading:true,
        }
     }
  },
  components: {
    "PopUp": PopUp,
  },
  mounted: function(){
     //outlookCommonUtil.makeHTTPRequest("GET","https://projects.csez.zohocorpin.com/restapi/portal/14079918/projects/146000000013005/bugs/defaultfields/",{"ticket":"6127453-fa828b0b-8649af72de729deb8b147527537fdbd6"},null,null,this.testing);
     this.getJwToken();
  },
  methods: {
    getJwToken: function(){
       Office.context.mailbox.getUserIdentityTokenAsync(this.parseJwToken);
    },
    parseJwToken: function(result){
       outlookVariables.jwt = result.value;
               console.log(result.value+"$$$$$$$$$$$");
       outlookLoginUtils.hasCredentialsInDb(this.checkLoginInDb);
    },
    checkLoginInDb: function(result){
       console.log("hello");
       //window.location.replace("https://gadgets.zoho.eu/html/outlook/ZohoCRM/ZohoCRMOutlookAddin.html");
       if(result){
          if(Office.context.mailbox.item.displayReplyForm === undefined){
            router.push({ path: '/compose'});
          }else{
            router.push({ path: '/home'});
          }

       }else {
          router.push({
             path: '/login'
          });
       }
       this.show.loading = false;
    },
    parsePortals: function(response,responseCode,request){
       if(responseCode === 200) {
          response = response.response;
          if(response.portals) {
             addinUtils.setProjectsUrl(response.portals[0].link.project.url);
             addinUtils.setLanguage(response.portals[0].locale.code);

          }else{
            console.log("CREATE NEW PORTAL SCREEN");
          }


       }else {

       }
    },
  },
};

var AccessError = {
   template:
   `<div>
        <button @click="refreshApp">reload</button>
        <button @click="signOut">signout</button>
    </div>
   `,
   methods: {
      signOut: function() {
         outlookLoginUtils.removeOauthToken(this.refreshApp);
      },
      refreshApp: function() {
         router.push({ path : '/' });
      }
   },
   watch: {
     "$route": function(){
        outlookLoginUtils.isLoggedInBrowser(this.checkLoginInBrowser);
     }
   }
};

var router = new VueRouter({
   mode: 'hash',
   base: '/',
   routes: [
      {
         path: '/home',
         component: Home,
         name: 'ZohoProjectsHome',
      },
      {
         path: '/compose',
         component: ComposeHome,
         name: 'ZohoProjectsComposeHome',
      },
      {
         path: '/login',
         component: Login,
         name: 'LoginScreen',

      },
      {
         path: '/task',
         component: Task,
         name: 'Task',
      },
      {
         path: '/bug',
         component: Bug,
         name: 'Bug',
      }
   ]
});




Office.initialize = function() {
   startApp();
};

var startApp = function() {
   item = Office.context.mailbox.item;
   console.log(document.cookie);
   console.log(Office.context.mailbox.item.displayReplyForm);
   roamingSettings = Office.context.roamingSettings;
   console.log(JSON.stringify(roamingSettings)+"***^^^^^***");
   addinUtils.clearConsole();
   storageHandler.deleteData();
   Vue.use(VueRouter);
   Vue.config.devtools = true;
   Vue.config.debug = true;
   Vue.config.silent = false;
   zohoProjectsApp = new Vue({
      el: '#app',
      router: router,
      render: function(data) {
         return data(ZohoProjects);
      }
   });
};