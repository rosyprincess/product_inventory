// import * as stream from 'stream';
// import * as fs from 'fs';
const util = require('util');
const stream = require('stream');
const fs = require('fs');
const {once} = require('events');
const finished = util.promisify(stream.finished); // (A)


console.log(`Welcome to product inventory managment system!`);
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  })

let produducts = new Map(); // <sku, name>
let warehouses = new Map(); // <warehouse#, limit>
let commands = [];
let batch = [];



readline.on('line', (input) => {
    if(input.trim().length === 0) {
        return;
    }
    commands.push(input);
    inputs = input.trim().match(/(".*?"|[^"\s]+)(?=\s*|\s*$)/g);
   
    switch(inputs[0]) {
        case `ADD`:
            switch(inputs[1]) {
                case `PRODUCT`:
                    // console.log(inputs.length);

                    if (inputs.length !== 4) {               
                        // console.log(inputs.length);
                        colorErrMsg(`ERROR: WORONG ARGUMENTS`);
                        break;
                    }
                    let name = inputs[2].substring(1, inputs[2].length - 1);
                    addProduct(name, inputs[3]);
                    break;
                case `WAREHOUSE`:
                    if (inputs.length === 3) {
                        addWarehouse(Number(inputs[2]), Infinity);
                    } else if(inputs.length === 4) {
                        addWarehouse(parseInt(Number(inputs[2])), Number(inputs[3]));
                    } else {
                        // console.log(inputs.length);
                        colorErrMsg(`ERROR: WRONG ARGUMENTS`);
                    }
                    break;
                default:
                    colorErrMsg(`ERROR: WRONG ARGUMENTS`);
            }
            break;
        
        case `STOCK`:
            if (inputs.length !== 4) {
                colorErrMsg(`ERROR: WRONG ARGUMENTS`);
                break;
            }
            stock(inputs[1], Number(inputs[2]), Number(inputs[3]));
            break;
        case `UNSTOCK`:
            if (inputs.length !== 4) {
                colorErrMsg(`ERROR: WRONG ARGUMENTS`);
                break;
            }
            unstock(inputs[1], Number(inputs[2]), Number(inputs[3]));
            break;
        case `LIST`:
            switch(inputs[1]) {
                case `PRODUCTS`:
                    listProducts();
                    break;
                case `WAREHOUSES`:
                    listWarehouses();
                    break;
                case `WAREHOUSE`:
                    if (inputs.length !== 3) {
                        colorErrMsg(`ERROR: WRONG ARGUMENTS`);
                        break;
                    }
                    listWarehouse(Number(inputs[2]));
                    break;
                default:
                    colorErrMsg(`ERROR: WRONG ARGUMENTS`)
            }
            break;
        default:
            colorErrMsg(`ERROR: WRONG ARGUMENTS`);
        }
        while (commands.length >= 2 && batch.length === 0) {
            // console.log(commands, ` commands`);
            // console.log(batch,` batch`);
            batch.push(commands.shift());
            batch.push('\n');
            batch.push(commands.shift());
            batch.push('\n');
            writeIterableToFile(batch, './log.txt');
            // console.log(`logged`);
        }  
             
});

async function writeIterableToFile(iterable, filePath) {
    const writable = fs.createWriteStream('log.txt', {flags: 'a'});
    
    for await (const chunk of iterable) {
      if (!writable.write(chunk)) {
        await once(writable, 'drain');
      }
    }
    writable.end(); // (C)
    batch = [];
    await finished(writable);
    // console.log(iterable, ` iterable`);
  }

function addProduct(name,  sku) {
    if (produducts.has(sku)){
        colorErrMsg(`ERROR: PRODUCT WITH SKU${sku} ALREADY EXISTS`);
    } else {
        produducts.set(sku, name);
    }

    // console.log(name);
    // console.log(sku);
}

function addWarehouse(warehouseNumber, limit) {
    // check input
    if (!isInteger(warehouseNumber, `WAREHOUSE#`)) {return;};
    if (warehouses.has(warehouseNumber)) {
        colorErrMsg(`ERROR: WAREHOUSE ${warehouseNumber} ALREADY EXISTS`);
        return;
    }
    if (limit != Infinity) {
        if (!isInteger(limit, `STOCK LIMIT`)){return;}
    }
    if (!positiveQuant(limit, `STOCK LIMIT`)) {return;};

    // create warehosue
    let warehouse = {
        warehouseNumber: warehouseNumber,
        limit: limit,
        remain: limit,
        listProducts : new Map(), // <sku, quantity> 
            
    };
    warehouses.set(warehouseNumber, warehouse);
    // console.log(warehouseNumber);
    // console.log(limit);
}

function stock(sku, warehouseNumber, quantity) {
    // check input

    if(warehouseNOTExists(warehouseNumber)) {return;};
    if(productNOTExists(sku)) {return};
    if(!isInteger(quantity, `STOCK QUANTITY`)) {return;};
    if(!positiveQuant(quantity, `STOCK QUANTITY`)) {return};
  // get selected warehouse and its product list
    let curWarehouse =  warehouses.get(warehouseNumber);
    let curListProducts = curWarehouse.listProducts;

    // create product if not in selected warehouse
    if (!curListProducts.has(sku)) {
        curListProducts.set(sku, 0); 
    }

    // check stock limit
    // update stock limit and product quantity
    if (curWarehouse.limit !== Infinity && curWarehouse.remain < quantity) {
        curListProducts.set(sku, curListProducts.get(sku) + curWarehouse.remain);
        curWarehouse.remain = 0;
        colorWarnMsg(`WARNING: WAREHOUSE ${warehouseNumber} HAS REACHED STOCK LIMIT`);
    } else {
        curListProducts.set(sku, curListProducts.get(sku) + quantity);
        curWarehouse.remain -= quantity;
    }

    // console.log(sku);
    // console.log(warehouseNumber);
    // console.log(quantity);
}

function unstock(sku, warehouseNumber, quantity) {
    // check input
    if(productNOTExists(sku)) {return;}
    if(warehouseNOTExists(warehouseNumber)) {return;};
    if(!isInteger(quantity, `UNSTOCK QUANTITY`)) {return;};
    if(!positiveQuant(quantity,`UNSTOCK QUANTITY`)) {return;};
    // get selected warehouse and its product list
    let curWarehouse =  warehouses.get(warehouseNumber);
    let curListProducts = curWarehouse.listProducts;

    // return if not such product in seleted warehouse
    if (!curListProducts.has(sku)) {
        msg = `ERROR: WAREHOUSE ${warehouseNumber} ALREADY EXISTS`;
        colorErrMsg(msg) // {sku => undefined}
        return;
    }
 
    // check stock limit
    // update warehouse stock and product quantity
    if (curListProducts.get(sku) < quantity) {
        curWarehouse.remain += curListProducts.get(sku);
        curListProducts.set(sku, 0);
        colorWarnMsg(`WARNING: PRODUCT WITH SKU ${sku} OUT OF STOCK`);
    } else {
        curListProducts.set(sku, curListProducts.get(sku) - quantity);
        curWarehouse.remain += quantity;
    }
    // console.log(sku);
    // console.log(warehouseNumber);
    // console.log(quantity);
}

function listProducts() {
    produducts.forEach((value, key) => console.log(`${value} ${key}`)); 
}

function listWarehouses() {
    console.log(`WAREHOUSES`);
    warehouses.forEach((_, key) => console.log(key));
}

function listWarehouse(warehouseNumber) {
    // console.log(warehouseNumber);
    //check input
    if (warehouseNOTExists(warehouseNumber)) {
        return;
    }
    let curListProducts = warehouses.get(warehouseNumber).listProducts;
    let arr = [ ];
    curListProducts.forEach((value, key) => arr.push(new row(produducts.get(key), key, value)));
    console.table(arr); 


}

// helper functions
function productNOTExists(sku) {
    if (!produducts.has(sku)) {
        colorErrMsg(`ERROR: PRODUCT WITH SKU ${sku} DOES NOT EXIST`);
        return true;
    }
    return false;
}

function warehouseNOTExists(warehouseNumber) {
    if (!warehouses.has(warehouseNumber)) {
        colorErrMsg(`ERROR: WAREHOUSE ${warehouseNumber} DOES NOT EXIST`);
        return true;
    }
    return false;
}
function isInteger(num, msg) {
    if (!Number.isInteger(num)) {
        colorErrMsg(`ERROR: ${msg} MUST BE INTEGER`);
        return false;
    }
    return true;
}
function positiveQuant(num, msg) {
    if (num <= 0) {
        colorErrMsg(`ERROR: ${msg} MUST BE POSITIVE`);
        return false;
    }
    return true;
} 
function row(name, sku, quant) {
    this.item_name = name;
    this.sku = sku;
    this.quantity = quant;
  } 
function colorErrMsg(msg) {
    console.error('\x1b[91m',msg,'\x1b[0m');
}
function colorWarnMsg(msg) {
    console.warn('\x1b[36m',msg,'\x1b[0m');
}
