var express = require('express');
var router = express.Router();
const sleep = require('system-sleep');
const fetch = require('node-fetch');
const fs = require('fs');



router.get('/', function (req, res, next) {

    //建立檔案數大於1
    let createMultipleFile = (yearArray, stockNo) => {
        console.log('createMultipleFile');

        fetch('http://localhost:3001/createStockFile?state=multiple', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ yearArray: yearArray, stockNo: stockNo })
        })

    }

    //建立檔案數少於等於1
    let createSingleFile = async (yearArray, noDataArray, stockNo, dir, stock, count) => {
        console.log('createSingleFile');
        if (count == 1) {
            fetch('http://localhost:3001/createStockFile?state=single&year=' + noDataArray[0] + '&stockNo=' + stockNo)
                .then((rs) => rs.json())
                .then((data) => {
                    console.log(data);
                    if (data.state == 'OK') {
                        //讀取已建立完成的json檔內容，post給前端
                        stock.data = readFile(yearArray, stockNo, dir, stock)
                    }
                })
        }
        else {
            stock.data = await readFile(yearArray, stockNo, dir, stock)
        }


        await sleep(300);
        console.log(stock.data);
        res.json({ stock: JSON.parse(JSON.stringify(stock)) });
    }
    
    let readFile = async (yearArray, stockNo, dir) => {
        let dataArray = [];
        console.log(yearArray);
        yearArray.forEach(async (year) => {
            let path = dir + '/' + year + '_' + stockNo + '.json';
            fs.readFile(path, 'utf8', async (err, data) => {
                if (err) {
                    console.log(err);
                }
    
                let stockObj = {};
                stockObj.date = year;
                stockObj.data = JSON.parse(data);
                dataArray.push(stockObj);                
            })
            await sleep(300);
        })

        return dataArray;
    }

    let checkFile = (starYear, lastYear, stockNo, dir) => {
        let yearArray = [];
        let noDataArray = [];
        let total = (lastYear - starYear) + 1;
        let count = 0;
        if (total == 1) {
            if (!fs.existsSync(dir + '/' + starYear + '_' + stockNo + '.json')) {
                count += 1;
            }
            noDataArray.push(starYear);
            yearArray.push(starYear);
        }
        else {
            for (let i = starYear; i <= lastYear; i++) {
                if (!fs.existsSync(dir + '/' + i + '_' + stockNo + '.json')) {
                    noDataArray.push(i);
                    count += 1;
                }
                yearArray.push(i);
            }
        }
        return { yearArray: yearArray, noDataArray: noDataArray, count: count };
    }

    let stock = {};
    //state = 0 成功 state = 1 稍後
    stock.state = 0;
    stock.content = '';
    stock.data = [];
    let startYear = 2018
    let lastYear = 2018
    let stockNo = '2880'
    let checkState = {};
    const dir = './dataJson';
    if (req.query.year != '') {
        startYear = parseInt(req.query.year, 10);
    }

    if (req.query.stockNo != '') {
        stockNo = req.query.stockNo;
    }

    checkState = checkFile(startYear, lastYear, req.query.stockNo, dir);
    console.log(checkState);
    if (checkState.count > 1) {
        //多年檔案需要建立，請使用者等待檔案建立完成後在重新整理        
        console.log(checkState.noDataArray);
        createMultipleFile(checkState.noDataArray, stockNo, dir);
        stock.state = 1;
        stock.content = '資料收集中，請' + checkState.count + '分鐘後重新整理';
        res.json({ stock: JSON.parse(JSON.stringify(stock)) });
    }
    else {
        //只有一年的檔案需要建立，或者不需要建立檔案     
        createSingleFile(checkState.yearArray, checkState.noDataArray, stockNo, dir, stock, checkState.count);
    }
});

module.exports = router;
