# product_inventory
This is a tool use to manage product inventory.
## Usage
Use command `node filepath/product_inventory.js` to start the program.

This tool accept 7 commands:

1. `ADD PRODUCT "PRODUCT NAME" SKU`
- This command adds a new product to our product catalog.
- "PRODUCT NAME" - STRING.
- SKU - Unique Identifier.
2. `ADD WAREHOUSE WAREHOUSE# [STOCK_LIMIT]`
- Creates a new warehouse where we can stock products.
- We assume that our warehouses can store infinitely many products if an optional stock limit argument is not specified.
- WAREHOUSE# - INTEGER
- STOCK_LIMIT - Optional, INTEGER
3. `STOCK SKU WAREHOUSE# QTY`
- Stocks QTY amount of product with SKU in WAREHOUSE# warehouse.
4. `UNSTOCK SKU WAREHOUSE# QTY`
- Unstocks QTY amount of product with SKU in WAREHOUSE# warehouse.
5. `LIST PRODUCTS`
- List all produts in the product catalog.
6. `LIST WAREHOUSES`
- List all warehouses.
7. `LIST WAREHOUSE WAREHOUSE#*`
- List information about the warehouse with the given warehouse# along with a listing of all product stocked in the warehouse. 

## Command History
When running the program, command history will be continually appending to log.txt in batches of two.

## Test
test_command.txt stores commands that used for testing. 
