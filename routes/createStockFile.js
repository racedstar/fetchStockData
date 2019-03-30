var express = require('express');
var router = express.Router();
const sleep = require('system-sleep');
const fetch = require('node-fetch');
const fs = require('fs');

let fetchData = async (year, stockNo) => {
    let dataArray = [];    
    for(let count = 1; count <= 12; count ++){
        let month = '';                
        if(count < 10){
            month = '0' + count;
        }
        else{
            month = '' + count;
        }
        
        console.log(year + month)
        await fetch('http://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&stockNo=' + stockNo + '&date='+ year + month + '01')
        .then(rs => rs.json())
        .then(data => {            
            dataArray.push(data.data[0]);
        });

        sleep(250);
    }
    return dataArray;
}

let createJsonFile = (year, stockNo, dataArray) =>{
    const dir = './dataJson';    
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir)
    }
    
    let path = dir + '/' +  year + '_' + stockNo + '.json'     
    fs.writeFile(path, JSON.stringify(dataArray), function(err){
        if(err){
            console.log('writeError');
        }        
    })
}

let createMultiple = async(yearArray, stockNo) => {    
    for(const year of yearArray){
        let data = await fetchData(year, stockNo)        
        await createJsonFile(year, stockNo, data)        
        await sleep(60000)
    }
}


//截取一年以上的資料，不返回資料
router.post('/', function(req, res, next){
    if(req.query.state == 'multiple') {                
        createMultiple(req.body.yearArray, req.body.stockNo);
    }
})

//截取一年的資料，並返回資料
router.get('/', function(req, res, next) {
    let createSingleFile = async(year, stockNo, dir) => {
        console.log('check res');
        let dataArray = [];
        dataArray = await fetchData(year, stockNo);        
        await createJsonFile(year, stockNo, dir, dataArray);

        res.json({state:'OK'})
    }
    
    let year = '';        

    if(req.query.year != ''){
        year = parseInt(req.query.year, 10);
    }
            
    //建立單檔成功後，回傳state
    if(req.query.state == 'single'){        
        createSingleFile(year, req.query.stockNo);
    }    
});

module.exports = router;
