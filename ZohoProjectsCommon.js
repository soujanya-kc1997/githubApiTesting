
//percentage,checkbox,datetime,currency field not checked and handled (csez layout didn't work)
var TextAreaComponent = {
    template : `
        <div  class="field" :class='error?"eField":""'>
			<label v-text="label"></label>
			<div class="">
				<textarea v-if='(type=="TextArea")' :id="id" :value="value" cols="33" rows="4" type="text" @input="valueChanged($event.target.value)" ></textarea>
				<input  class="inputbox" v-else-if='(type=="phone" || type=="int")' :id="id" :value="value" @input="valueChanged($event.target.value)"  type="number" :class='"subject "+(error?"error-border":"")' v-on:keypress="isNumber(event)" />
				<input v-else type="text" :id="id" :value="value" placeholder="Task Name" @input="valueChanged($event.target.value)"></input>
			</div>
			<div v-if="error" class="error" v-text="errorMessage" ></div>
		</div>
    `,
    props: ["id","label","mandatory","error","errorMessage","value","type"],
    data: function() {
       var value;
       console.log(this.errorMessage,this.error);
       if(this.value == null && this.value  == undefined){
          value = '';
       }else {
          value = this.value;
       }
       return value;
    },
    methods: {
        valueChanged:function(value){
          this.error=false;
          console.log(this.error)
          this.$emit('input', value);
          this.$parent.valueChanged(this.id);
        },

        isNumber: function(evt) {
            evt = (evt) ? evt : window.event;
            var charCode = (evt.which) ? evt.which : evt.keyCode;
            if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) {
                evt.preventDefault();
            } else {
                this.valueChanged(this.value);
                return true;
            }
        }
    },
};


var checkBoxComponent={
    template : `
            <div class="field" :class='error?"eField":""'>
    			<label>testing</label>
    			<input type="checkbox" :id="id" v-model="value"></input>
    			<label v-text="label"><label>
    			<div class="error" v-text="errorMessage" v-if="error"></div>
    		</div>
        `,
        props: ["label","mandatory","id","value","disabled","errorMessage","error"],
        data: function() {
           var value;
           if(this.value == null && this.value == undefined){
              value = '';
           }else {
              value = this.value;
           }
           return value;
        },
        methods:{
            'valueChanged':function(){
                this.error = false;
                this.$emit('input', this.value);
                this.$parent.valueChanged(this.id);
            },

        },
        watch:{
            value:function(){
                this.valueChanged();
            },

        }
};

var multiSelectComponent = {
    template: `
        <div class="field" :class='error?"eField":""' :id="id">
			<label>{{label}}</label>
			<div class="gField">
				<span class="roundbox">
					<input type="checkbox" :id="multiSelectCheckboxId" @change="checkAll($event)"/>
					<label :for="multiSelectCheckboxId"></label>
				</span>
				<span class="expCol" @click="showListing=!showListing">
					<i>i</i>
				</span>
				<span>{{this.options.length}} {{label}}</span>
				<div :class="showListing?'expCont':''" >
					<ul>
						<li v-for="option in this.options">
							<span class="roundbox">
								<input ref="multiSelectBoxes" type="checkbox" :id="option.optionId" :value="ifattachment?JSON.stringify(option):option.optionId"   v-on:input="onSeletionChange($event.target.checked,$event.target.value)"/>
								<label :for="option.optionId"></label>
							</span>
							<span :for="option.optionId" class="fileAtt">{{option.name}}<em v-if="ifattachment" v-text="bytesToSize(option.size,2)"></em></span>
						</li>
					</ul>
				</div>
			</div>
			<div class="error" v-text="errorMessage" v-if="error"></div>
		</div    `,
    name : "MultiSelect Component",
    props: ["id","label","mandatory","error","errorMessage","value","options","column_name"],

    data: function() {
       //console.log("lenght of options"+this.options.length);
       console.log(this.options);
       return {
          showListing : true,
          selectedFiles:[],
          listCheckBoolean: true,
       }
    },
    computed:{
       ifattachment : function(){
          if(this.id == "uploaddoc"){
             return true;
          }else{
             return false;
          }
       },
       multiSelectCheckboxId : function(){
         return this.id+"_multiSelectCheckbox";
       }
    },

    methods:{
       stringifyOption : function(data){
          return JSON.stringify(data);
       },
       onSeletionChange : function(check,value){
         console.log("on selection");
         if(check){
           this.ifattachment?this.value.push(JSON.parse(value)):this.value.push(value);
         }else{
           this.value.splice(this.value.indexOf(value),1);
         }
         this.updateToParent();
       },

       updateToParent:function(){
          this.error=false;
          console.log(this.options);
          console.log(this.value);
          this.$emit('input',this.value);
          this.$parent.valueChanged();
       },

       checkAll:function(event){
          var checkedValue = document.getElementById(this.multiSelectCheckboxId);
          var listedValues = this.$refs.multiSelectBoxes;
          if(checkedValue.checked == true){
             this.value = [];
             for(var i=0 ; i<listedValues.length ; i++){
                this.$set(this.$refs.multiSelectBoxes[i],"checked",true);
                console.log(this.$refs.multiSelectBoxes[i].value);
                this.onSeletionChange(true,this.$refs.multiSelectBoxes[i].value)
             }
          }else{
            for(var i=0 ; i<listedValues.length ; i++){
               this.$set(this.$refs.multiSelectBoxes[i],"checked",false);
               console.log(this.$refs.multiSelectBoxes[i].checked,this.value);
               this.onSeletionChange(false,this.$refs.multiSelectBoxes[i].value)
            }
          }
          console.log(checkedValue.checked+"HHJKKL",this.$refs.multiSelectBoxes);
          this.updateToParent();
       },

       bytesToSize: function(bytes,decimals){
         if(bytes == 0) return "0 Bytes";
         var kilobytes = 1024;
         var decimal = decimals <= 0 ? 0 : decimals || 2;
         var sizes = ["Bytes","KB","MB","TB","PB","EB","ZB","YB"];
         var i = Math.floor(Math.log(bytes)/Math.log(kilobytes));
         return parseFloat((bytes / Math.pow(kilobytes,i)).toFixed(decimal))+' '+sizes[i];
       },

    },

    watch:{
      'showListing': function(){
         console.log(this.showListing+"listing data");
      }
    }

}

var dropDownComponent = {
    props: ["id","label","mandatory","error","errorMessage","value","options","column_name"],
    template:`
        <div class="field" :class='error?"eField":""' :id="id">
			<label>{{label}}</label>
			<div class="iField">
				<input type="text" class="dropdown" placeholder="--Select--" :value="valueLabel">
				<i  :class="dropDown?'pa-dropdown':''" @click="dropDown=!dropDown">i</i>
				<div class="callout">
					<ul>
						<li v-for="option in this.options" v-text="option.name" @click.stop="selectValue(option)"></li>
					</ul>
				</div>
			</div>
			<div class="error" v-text="errorMessage" v-if="error"></div>
		</div>
    `,
    name:"DropDown Component",
    data: function() {
      console.log(JSON.stringify(this.options));
      return {
         dropDown: false,
      }
    },
    computed:{
       valueLabel : function(){
          for(var i=0;i<this.options.length;i++){
             var selectedId = this.options[i].optionId;
             if(selectedId == this.value){
                return this.options[i].name;
             }
          }
          return '';
       }
    },
    methods: {
      selectValue(option){
        this.error=false;
        this.valueLabel = option.name;
        this.value = option.optionId;
        this.dropDown=!this.dropDown;
      },
    },
    watch:{
      'value': function(){
         console.log(this.value+"listing data");
         this.$emit('input', this.value);
         this.$parent.valueChanged(this.id);
      }
    }
};

var datePickerTemplate=`
<div class="field" :class='error?"eField":""' >
  <label v-text="label"></label>
  <div class="iField">
      <input :id="id" type="text" class="dropdown" :value="value"/>
      <i :class="dropDown?'pa-dropdown':''" @click="dropDown=!dropDown">i</i>
      <div class="callout calendar"></div>
  </div>
  <div v-text="errorMessage" v-if="error"></div>
<div>
`;

var datePickerComponent={
    template:datePickerTemplate,
    props:["model","label","mandatory","id","error","errorMessage","disabled","value"],
    data:function(){
        return {errorClass:'',errorMessageStyle:'',dropDown: true};
    },
    mounted:function(){
      $("#"+this.id).datetimepicker({
          mask: '',
          lang: 'en',
          timepicker: true,
          format: 'm-d-Y',
          formatDate: 'm-d-Y',
          defaultSelect:true,
          onChangeDateTime:this.valueChanged
      });
    },
    methods:{
        valueChanged:function(time,input){
          this.error=false;
          if(time!==null && time !== undefined){
            this.dropDown=!this.dropDown;
            console.log("input context value"+input.context.value+"******"+this.dropDown);
            this.$emit('input', input.context.value);
            this.model=time.getTime();
            this.$parent.valueChanged(this.id);
          }
        },
    },

};

var inputComponent = {

   template: `
          <textComponent v-if='(field.column_type=="singleline" || field.column_type=="int" || field.column_type=="email" || field.column_type=="phone" || field.column_type=="double" || field.column_type=="Website" || field.column_type=="TextArea" || field.column_type=="Currency" || field.column_type == "url")' :type="field.column_type"  v-model="field.value" :id="field.id" :label="field.display_name" :error="field.error" :errorMessage="field.errorMessage"></textComponent>
          <checkBoxComponent v-else-if='(field.column_type=="checkBox")' v-model="field.value" :id="field.id" :label="field.display_name" :error="field.error" :errorMessage="field.errorMessage"></checkBoxComponent>
          <dropDownComponent v-else-if='(field.column_type=="dropDown" || field.column_type=="userpicklist" || field.column_type=="picklist")' v-model="field.value" :options="field.options"  :id="field.id" :label="field.display_name" :error="field.error" :errorMessage="field.errorMessage"></dropDownComponent>
          <multiSelectComponent v-else-if='(field.column_type=="multiSelect")' v-model="field.value" :id="field.id" :label="field.display_name"  :options="field.options" :error="field.error" :errorMessage="field.errorMessage"></multiSelectComponent>
          <datePickerComponent v-else-if='(field.column_type=="date")' v-model="field.value" :id="field.id" :label="field.display_name"  :options="field.options" :error="field.error" :errorMessage="field.errorMessage"></datePickerComponent>
   `,
   name : "Input Component",
   props:["field","id","value"],
   data:function(){
      var field = this.field;
      if(this.field.value == undefined && this.field.value == null){
         field.value = '';
      }
      if(this.field.column_type == "multiSelect"){
         console.log(JSON.stringify(this.field));
         console.log(this.field.options);
      }
      return field;
   },

   components : {
      "textComponent" : TextAreaComponent,
      "checkBoxComponent":checkBoxComponent,
      "dropDownComponent":dropDownComponent,
      "multiSelectComponent":multiSelectComponent,
      "datePickerComponent":datePickerComponent,
   },
   methods:{
    valueChanged:function(id){
      this.field.error=false;
      this.field.errorMessage="";
      console.log("input component value"+this.field.value);
      this.$parent.valueChanged(id,this.field.value);
    }
  }

};

var menuComponent = {
   name : "Menu Component",
   template : ``,
   props : [],
   data : function(){

   },
   components : {

   },
   methods : {

   },
};



