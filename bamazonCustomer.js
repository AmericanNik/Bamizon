var mysql = require("mysql");
var inquirer = require('inquirer');
const CFonts = require('cfonts');
var Table = require('easy-table')





var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "Enter Password Here",
    database: "bamizon"
});

function start() {

    CFonts.say('Bamizon', {
        font: 'block',              // define the font face
        align: 'left',              // define text alignment
        colors: ['system'],         // define all colors
        background: 'transparent',  // define the background color, you can also use `backgroundColor` here as key
        letterSpacing: 1,           // define letter spacing
        lineHeight: 1,              // define the line height
        space: true,                // define if the output text should have empty lines on top and on the bottom
        maxLength: '0',             // define how many character can be on one line
    });

    inquirer.prompt({
        type: 'list',
        name: 'choice',
        message: 'What do you want to do?',
        choices: ['Customer View', 'Manager View', 'Supervisor View', 'Exit']
    }).then(answers => {
        if (answers.choice === 'Customer View') {
            customer();
        };

        if (answers.choice === 'Manager View') {
            manager();
        };
        if (answers.choice === 'Supervisor View') {
            supervisor();
        };
        if (answers.choice === 'Exit') {
            connection.end();
        }
    });
};

function customer() {
    connection.query('SELECT * FROM bamizon.products', function (err, results) {
        if (err) throw err;
        results.forEach(function (element) {
            console.log('-----------------------')
            console.log('Item ID: ' + element.item_id)
            console.log('Product Name: ' + element.product_name)
            console.log('Department: ' + element.department_name)
            console.log('Prce: ' + element.price)
            console.log('Stock: ' + element.stock_quantity)
        });

        inquirer.prompt([

            {
                name: 'id_choice',
                message: "What's the ID number of the item you wish to purchase?"
            }, {
                type: "input",
                name: "purchase_amount",
                message: "How many would you like to purchase?"
            }
        ]).then(answers => {
            let user_choice = answers.id_choice;
            let user_amount = parseInt(answers.purchase_amount);


            queryStr = "SELECT * FROM bamizon.products WHERE ?"

            connection.query(queryStr, { item_id: user_choice }, function (err, results) {
                if (err) throw err;
                results.map(x => {
                    let existing_amount = parseInt(x.stock_quantity);

                    if (user_amount <= existing_amount) {
                        console.log('---------RECIEPT--------------')
                        console.log('Order Total: ' + (x.price * user_amount))
                        console.log('Product Name: ' + x.product_name)
                        console.log('Price: ' + x.price)
                        console.log('Quantity Ordered: ' + user_amount)
                        console.log('Order Total: $' + (x.price * user_amount))
                        let newQuantity = existing_amount - user_amount;
                        console.log('Remaining Quantity: ' + newQuantity)
                        let queryUpdate = 'UPDATE products SET stock_quantity = ? WHERE item_id = ?'
                        connection.query(queryUpdate, [newQuantity, user_choice])

                        let salesTotal = user_amount * x.price;
                        let queryUpdate2 = 'UPDATE products SET product_sales = ? WHERE item_id = ?'
                        connection.query(queryUpdate2, [salesTotal, user_choice])

                        start();
                    }
                    if (user_amount > existing_amount) {
                        console.log('We only have ' + x.stock_quantity + " " + x.product_name + 's left!');
                        start();
                    }
                })
            });
        });
    });
}

function manager() {

    inquirer.prompt({
        type: 'list',
        name: 'category',
        message: 'Welcome Manager, what would you like to do?',
        choices: ['View Products For Sale', 'View Low Inventory', 'Add To Inventory', 'Add New Products', 'Exit'],
    }).then(answers => {
        if (answers.category === 'View Products For Sale') {
            viewProducts();
        };

        if (answers.category === 'View Low Inventory') {
            lowInventory();
        };
        if (answers.category === 'Add To Inventory') {
            addInventroy();
        };
        if (answers.category === 'Add New Products') {
            addProduct();
        };
        if (answers.category === 'Exit') {
            connection.end();
        }
    });

}


function viewProducts() {
    connection.query('SELECT * FROM bamizon.products', function (err, results) {
        if (err) throw err;
        console.log('---------PRODUCTS FOR SALE--------------')

        results.forEach(function (element) {
            console.log('Item ID: ' + element.item_id)
            console.log('Product Name: ' + element.product_name)
            console.log('Department: ' + element.department_name)
            console.log('Prce: ' + element.price)
            console.log('Stock: ' + element.stock_quantity)
            console.log('-----------------------')
        });
        manager();
    })
};

function lowInventory() {
    console.log('LOW INVNETORY')
    connection.query('SELECT * FROM bamizon.products WHERE stock_quantity <=5', function (err, results) {
        if (err) throw err;
        console.log('---------LOW INVENTORY ON THESE ITEMS:--------------')

        results.forEach(function (element) {
            console.log('Item ID: ' + element.item_id)
            console.log('Product Name: ' + element.product_name)
            console.log('Department: ' + element.department_name)
            console.log('Prce: ' + element.price)
            console.log('Stock: ' + element.stock_quantity)
            console.log('-----------------------')
        });
        manager();
    })

};

function addProduct() {

    connection.query('SELECT department_name FROM bamizon.departments', function (err, results) {

        inquirer.prompt([{
            name: "category",
            type: "rawlist",
            choices: function () {
                return results.map(r => r.department_name);
            },
            message: "Select which department you'd like to add your product to: "
        }, {
            type: 'input',
            name: 'item_name',
            message: "What's the name of the item?"
        }, {
            type: "input",
            name: "price",
            message: "Enter your item's price:"
        }, {
            type: "input",
            name: "stock",
            message: "Enter starting inventory stock amount: "
        }
        ]).then(answers => {
            console.log(answers.item_name);
            console.log(answers.category);
            console.log(answers.price);
            connection.query(
                "INSERT INTO products SET ?",
                {
                    product_name: answers.item_name,
                    department_name: answers.category,
                    price: answers.price || 0,
                    stock_quantity: answers.stock || 0
                },
                function (err) {
                    if (err) throw err;
                    console.log("Your product was added successfully!");
                    start();
                }
            );
        });
    })
}



function addInventroy() {

    connection.query('SELECT * FROM bamizon.products', function (err, results) {
        if (err) throw err;
        results.forEach(function (element) {
            console.log('-----------------------')
            console.log('Item ID: ' + element.item_id)
            console.log('Product Name: ' + element.product_name)
            console.log('Department: ' + element.department_name)
            console.log('Prce: ' + element.price)
            console.log('Stock: ' + element.stock_quantity)
        });
        inquirer.prompt([

            {
                name: 'id_choice',
                message: "What's the ID number of the item you wish add stock for: "
            }, {
                type: "input",
                name: "stock_increase",
                message: "How many units would you like to add to current inventory? "
            }
        ]).then(answers => {
            let user_choice = answers.id_choice;
            let user_amount = parseInt(answers.stock_increase);


            queryStr = "SELECT * FROM bamizon.products WHERE ?"

            connection.query(queryStr, { item_id: user_choice }, function (err, results) {
                if (err) throw err;
                results.map(x => {
                    let existing_amount = parseInt(x.stock_quantity);

                    if (user_amount <= existing_amount) {
                        let newQuantity = existing_amount + user_amount;
                        console.log('New Quantity: ' + newQuantity)
                        let queryUpdate = 'UPDATE products SET stock_quantity = ? WHERE item_id = ?'
                        connection.query(queryUpdate, [newQuantity, user_choice])
                        start();
                    }

                })
            });
        });

    });
}



function supervisor() {
    inquirer.prompt({
        type: 'list',
        name: 'category',
        message: 'Welcome Supervisor, what would you like to do?',
        choices: ['View Sales By Department', 'Create New Department', 'Exit'],

    }).then(answers => {

        if (answers.category === 'View Sales By Department') {
            connection.query('SELECT departments.department_id, departments.department_name, departments.overhead_costs, products.product_sales FROM products INNER JOIN departments on departments.department_name=products.department_name GROUP BY department_name;', function (err, results) {
                var t = new Table
                results.forEach(x => {

                    t.cell('department ID: ', x.department_id);
                    t.cell('department name: ', x.department_name);
                    t.cell('overhead costs: ', x.overhead_costs);
                    t.cell('product sales: ', x.product_sales);
                    t.cell('Profits: ', (x.product_sales - x.overhead_costs), Table.number(2));
                    t.newRow()
                });
                console.log(t.toString())
            });

        }

        if (answers.category === 'Create New Department') {
            inquirer.prompt([
                {
                    type: 'input',
                    name: 'cat_name',
                    message: "What's the name of the new department?"
                }, {
                    type: "input",
                    name: "overhead_cost",
                    message: "What's the overhead cost of department"
                }
            ]).then(answers => {
                connection.query(
                    "INSERT INTO departments SET ?",
                    {
                        department_name: answers.cat_name,
                        overhead_costs: answers.overhead_cost,
                    },
                    function (err) {
                        if (err) throw err;
                        console.log("Your department  was added successfully!");
                        start();
                    }
                );
            });
        }
        if (answers.category === 'Exit') {
            connection.end();
        }
    })
}
connection.connect(function (err) {
    if (err) throw err;
    start();
});


