/////// THE UI CONTROLLER/////
var UIController=(function()
{
    var DOMstrings=
        {
            inputType:".add__type",
            inputDescription: ".add__description",
            inputValue:".add__value",
            inputBtn:'.add__btn',
            expContainer: ".expenses__list",
            incContainer: ".income__list",
            budgetValue: ".budget__value",
            totalIncValue:".budget__income--value",
            totaExpValue:".budget__expenses--value",
            bugetPercentage:".budget__expenses--percentage",
            container:".container-clearfix",
            expPercentLabel:".item__percentage",
            dateLabel: ".budget__title--month"
        };
    //Formating Numbers to in the form  +/-300,000.00
    var formatNumber= function(type,num){
        var number;
        number=(Math.abs(num)).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits: 2});
        return (type==="exp"? "-" : '+')+ number;
    };
    
    //looping through a list
    var nodeListForEach= function(list,callBackFnc){
                for(var i=0; i<list.length; i++){
                    callBackFnc(list[i],i);
                }
            };
   
    return {
        
        //display month and year
        diplayDate: function(){
            var now, month, months, year;
            now= new Date();
            month=now.getMonth();
            year= now.getFullYear();
            months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            document.querySelector(DOMstrings.dateLabel).textContent=months[month]+' ' + year;
           
        },
        
        //Changing the outline color and button color for fields and button when +/-
        changeTypeColor: function(){
            fieldList=document.querySelectorAll(DOMstrings.inputType+','+DOMstrings.inputDescription+','+DOMstrings.inputValue);
            nodeListForEach(fieldList,function(currentValue){
                currentValue.classList.toggle('red-focus');
            });
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },
        
        
        //make the DOMstrings public
        getDOMstring: function()
        {
            return DOMstrings;
        },
        
        //get input from ui//
        getInputData:function()
        {
            return{
                dataType: document.querySelector(DOMstrings.inputType).value/*inc or exp*/,
                dataDiscription:document.querySelector(DOMstrings.inputDescription).value,
               dataValue:parseFloat(document.querySelector(DOMstrings.inputValue).value)                
            };
                 
        },
        
        //obtain the data from data control via App Controller and display to UI in a list form
        addListItem: function(obj,type){
            
            var html, newHtml, element;
            
            //1. create html string with placeholder text
            if(type==='inc'){
                
                element=DOMstrings.incContainer;
                html='<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }
            
            else if(type==='exp'){
                
                element=DOMstrings.expContainer;
                html='<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }
            
            //2. Replace placeholders in html with actual data

            newHtml=html.replace('%id%',obj.id);
            newHtml=newHtml.replace('%description%',obj.description);
            newHtml=newHtml.replace('%value%',formatNumber(type,obj.value));
            
            //3. insert the html into the dom
            document.querySelector(element).insertAdjacentHTML("beforeend",newHtml);

        },
        
        //clear the input Fields in the HTML
        clearFields: function(){
            
            var fields, fieldArray;
            fields=document.querySelectorAll(DOMstrings.inputDescription+','+DOMstrings.inputValue);
            fieldArray=Array.prototype.slice.call(fields);
            fieldArray.forEach(function(currentValue,index,array){
                currentValue.value="";
            });
            fieldArray[0].focus();
        },
        
        //display budget in UI
        displayBudget: function(obj){
            var type;
            obj.budget>0? type="inc" : type="exp";
            document.querySelector(DOMstrings.budgetValue).textContent= formatNumber(type,obj['budget']);
            document.querySelector(DOMstrings.totalIncValue).textContent=formatNumber('inc',obj['totalIncome']);
            document.querySelector(DOMstrings.totaExpValue).textContent=formatNumber('exp',obj['totalExpense']);
                if(obj.percentage!==-1 ){
                    document.querySelector(DOMstrings.bugetPercentage).textContent=obj['percentage']+'%';
                    document.querySelector(DOMstrings.bugetPercentage).style.display="block";
                }
                else{
                    document.querySelector(DOMstrings.bugetPercentage).style.display="none";
                }  
            
        
    },
        
        //Display Expense percentages in UI
        displayExpPercentages: function(expPercentArray){
            var fields= document.querySelectorAll(DOMstrings.expPercentLabel);
            nodeListForEach(fields,function(currentValue,index){
                if(expPercentArray[index]>0){
                    currentValue.textContent=expPercentArray[index]+'%';
                    currentValue.style.display="block";
                }
                else
                    {
                        currentValue.style.display="none";
                    }
                }
            )
        },
        
        //delete Item from the UI
        deleteListItem: function(elementId){
            var el=document.getElementById(elementId);
            el.parentNode.removeChild(el);
        }
        
       
        };
    
})();


//////THE DATA CONTROLLER/////
var budgetController=(function(){
    ///expense class
    var Expense= function(id,description,value)
    {
        this.id=id;
        this.description=description;
        this.value=value;
        this.percentage= -1; // -1 sets %age to undefined
    }
    
    //expense Percentage calculator prototype method
    Expense.prototype.calcPercentage= function(totalIncome){
        totalIncome >0 ? this.percentage=Math.round((this.value/totalIncome)*100) : this.percentage= -1;
    };
    
    //expense percentage value retriever method
    Expense.prototype.getPercentage= function(){
        return this.percentage;
    }
    
    ///income class
    var Income=function(id,description,value)
    {
        this.id=id;
        this.description=description;
        this.value=value;
    }
    
    ///dat structures for income,expense and thier respective totals
    var data=
        {
            allItems:{
                inc:[],
                exp:[]
            },

            totals:{
                inc:0,
                exp:0
            },
            budget:0,
            percentage:-1
        };
    
    //setting the data.totals.(inc/exp)
    var calculateTotals=function(type){
        var sum=0;
        data.allItems[type].forEach(function(currentValue){
            sum+=currentValue.value;
        })
        data.totals[type]=sum;
    };
    
    
    //public method to store and process in data from the UI
    return{
        //adding items to data object
        addDataItem: function(type,desc,val){
            var newItem,ID;
            
            //create new id, ID=lastId+1, lastId=inc[inc.length-1]=>thatValue, thus "thatValue's .id +1 will give the current ID of the current value.
            if(data.allItems[type].length>0)
            {
                ID=data.allItems[type][data.allItems[type].length-1].id+1;  
            }
            else
                {
                    ID=0;
                };
            
            //create new item based on inc or exp type
            if(type ==='exp')
             {
                 newItem= new Expense(ID,desc,val);
             }
            else if(type ==='inc')
                {
                    newItem= new Income(ID,desc,val);    
                };
            
            //push object instance into the data structure
            data.allItems[type].push(newItem);
            
            //return new element
            return newItem;
            
                      
        },
        
        //deleting items from the data object
        deleteDataItem: function(type,Id){
            var idArray, ID;
            
            idArray=data.allItems[type].map(function(item){
                return item.id;
            });
            ID=idArray.indexOf(Id);
            if(idArray!==-1){
                data.allItems[type].splice(ID,1);
            }
        },
        
        calculateBudget: function(){
            //1.calculating total expense/income
            calculateTotals('inc');
            calculateTotals('exp');
            
            //2.calculate the budget: income-expense
            data.budget=data.totals.inc - data.totals.exp;
            
            //3.calculating the percentage of income spent
            data.totals.inc>0 ? data.percentage= Math.round((data.totals.exp/data.totals.inc)*100):data.percentage=-1;
            
            
        },
        
        //calculate the percentage of each exp object to total income
        calculateExpPercentage: function(){
            data.allItems.exp.forEach(function(item){
                                      item.calcPercentage(data.totals.inc);
                                      })
        },
        
        // retrieve the expense percentage of each expense object into an array
        getExpPercentage: function(){
          var allExpPercentages =data.allItems.exp.map(function(item){
             return item.getPercentage();
          });
          return allExpPercentages;
        },
        
        //retrive total inc,exp,% and budget
        getBudget: function(){
            return{
                totalExpense: data.totals.exp,
                totalIncome: data.totals.inc,
                percentage: data.percentage,
                budget: data.budget    
            };
        },
        
        //testing our data
        testing: function(){
        console.log(data);},
    
        
        
    };
    })();



///////GLOBAL APP CONTROLLER//////
var appController=(function(budgetCtrl,UIctrl)
{   
   
   //function to update the budget/// 
    var updateBudget= function(){
        //1.calculate the budget
        budgetCtrl.calculateBudget();

        //2.Return the budget
        var budget=budgetCtrl.getBudget();
        
        //3.Display the budget on the UI
        UIctrl.displayBudget(budget);
    };
    
    //function to update the expense percentages//
    var updateExpPercentages= function(){
        //1.calulate percentages
        budgetCtrl.calculateExpPercentage();
        
        //2.Read Percentages from the Data Controller
        var ExpPercentArray=budgetCtrl.getExpPercentage();
        
        //Update UI with the new percentages
        console.log(ExpPercentArray);
        UIctrl.displayExpPercentages(ExpPercentArray);
    };
    
  //***********Adding input to data and UI**************************
    var ctrlAddItem=function()
    {
        
        var input,newItem;
        //1.get the field input data 
        input=UIctrl.getInputData();
        
        if(input.dataDiscription!=="" && !isNaN(input.dataValue)&& input.dataValue>0){
            //2. pass the input data to the budgetController(data module)
            newItem=budgetCtrl.addDataItem(input.dataType,input.dataDiscription,input.dataValue);
            


            //3.display the data on the UI

            UIctrl.addListItem(newItem,input.dataType);

            //4.clear the fields

            UIctrl.clearFields();

            //5.calculate and update the budget
            updateBudget();
            
            //6.update expense percentages
            updateExpPercentages();
            
        }
        
        
        
    };
    
    //>******************Deleting items from Data & UI******************
    var ctrlDeleteItem= function(event){
        var itemType,Id,splitId;
       // console.log(event.target.parentNode.parentNode.parentNode.parentNode.id);
        var itemId=event.target.parentNode.parentNode.parentNode.parentNode.id;
        if(itemId){
            splitId=itemId.split("-");
            itemType=splitId[0];
            Id=parseInt(splitId[1]);
        }
        //1.delete item from our data structure.
        budgetCtrl.deleteDataItem(itemType,Id);
        
        //2.delete item from the UI
        UIctrl.deleteListItem(itemId);
        
        //3.recalculate and update the budget
        updateBudget();
        
        //4.update expense percentage
        updateExpPercentages();
        
    };
    
    
    
    //************************setting up event listners for accepting input***************************//
    var setUpEventListners= function(){
        //get domstrings//
        var Dom=UIctrl.getDOMstring();

        //event listners for accepting User input//
        document.querySelector(Dom.inputBtn).addEventListener('click',ctrlAddItem);
        document.addEventListener('keypress',function(event){
            if(event.keyCode===13||event.which===13){
                ctrlAddItem();   
            }
        });
        //event Listener for deleting User Input//
        document.querySelector(Dom.container).addEventListener('click',ctrlDeleteItem);
        
        //event listner for changing outline color based on +/-
        document.querySelector(Dom.inputType).addEventListener('change',UIctrl.changeTypeColor);
    };
 
    //************THINGS TO DO WHEN THE WEBPAGE IS LOADED OR RELODED*****************************
    return {
        init: function(){
        console.log("Application has started");
        UIctrl.diplayDate();
        setUpEventListners();
        UIctrl.displayBudget({totalExpense:0,
                                  totalIncome:0,
                                  percentage:0,
                                  budget:0});
        }        
    };
    
    
    
})(budgetController,UIController);

//************************Starting the program*************************************
appController.init();








