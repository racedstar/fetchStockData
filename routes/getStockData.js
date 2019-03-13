var express = require('express');
var router = express.Router();
const sleep = require('system-sleep');
const fetch = require('node-fetch');
const fs = require('fs');



/* GET home page. */
router.get('/', function(req, res, next) {            
    let fetchData = async (year, stockNo) => {
        let title = '';
        let dataArray = [];        
        for(let count = 1; count <= 12; count ++){
            let month = '';        
            if(count < 10){
                month = '0' + count;
            }
            else{
                month = '' + count;
            }
    
            console.log(year + month);
    
            await fetch('http://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&stockNo=' + stockNo + '&date='+ year + month + '01')
            .then(rs => rs.json())
            .then(data => {                
                dataArray.push(data.data[0]);                         
            });
    
            sleep(150);
        }
        return dataArray;
    }
    
    let createJsonFile = (dataArray, dir, year, stockNo) =>{    
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir)
        }                
        fs.writeFile(dir + '/' + year + '_' + stockNo + '.json', JSON.stringify(dataArray), function(err){
            if(err){
                console.log('writeError');
            }        
        })
    }
    
    let postData = async (year, stockNo) =>{
        let dataArray = [];
        const dir = './dataJson'        
        if(!fs.existsSync( dir + '/' + year + '_' + stockNo + '.json')){
            dataArray = await fetchData(year, stockNo);            
            await createJsonFile(dataArray, dir, year , stockNo);
        }
        
        fs.readFile(dir + '/' + year + '_' + stockNo + '.json', 'utf8', async (err, data) =>{
            if(err){                
                console.log(err);
            }            
            await res.json({ data:  JSON.parse(data)});
        })    
    }
    
    let year = '2018';
    let stockNo = '2880'
    if(req.query.year != ''){
        year = req.query.year;
    }

    if(req.query.stockNo != ''){
        stockNo = req.query.stockNo;
    }

    postData(year, stockNo);
    
});

module.exports = router;
