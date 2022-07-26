'use strict';

const router = require('express').Router();
const Store = require('../utils/store');
const Store = new Store();
const CustomerSession = new Map();

const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');

const Whatsapp = new WhatsappCloudAPI({
    accessToken: process.env.Meta_WA_accessToken,
    senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
    WABA_ID: process.env.Meta_WA_wabaId,
})

router.get('/callback', (req, res) => {
    try{
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];

        if(mode && token && challenge && mode === 'subscribe' &&  process.env.Meta_Wa_VerifyToken === token){
            console.log("Get: I am verified!");
            res.status(200).send(challenge);
        }else{
            console.log("Get: I am not verified!");
            res.status(403).send('Error, wrong token');
        }
    }catch(err){
        console.log(err);
        res.status(500).send(err);
    }    
})

router.post('/callback',async (req, res) => {
    try{
        let data = Whatsapp.parseMessage(req.body);

        if(data?.isMessage){
            let incomingMessage = data.message;
            let recipientPhone = incomingMessage.from.phone; // extract the phone number of sender
            let recipientName = incomingMessage.from.name;
            let typeOfMsg = incomingMessage.type; // extract the type of message (some are text, others are images, others are responses to buttons etc...)
            let message_id = incomingMessage.message_id; // extract the message id

            // Start of cart logic
            if (!CustomerSession.get(recipientPhone)) {
                CustomerSession.set(recipientPhone, {
                    cart: [],
                });
            }

            let addToCart = async ({ product_id, recipientPhone }) => {
                let product = await Store.getProductById(product_id);
                if (product.status === 'success') {
                    CustomerSession.get(recipientPhone).cart.push(product.data);
                }
            };

            let listOfItemsInCart = ({ recipientPhone }) => {
                let total = 0;
                let products = CustomerSession.get(recipientPhone).cart;
                total = products.reduce(
                    (acc, product) => acc + product.price,
                    total
                );
                let count = products.length;
                return { total, products, count };
            };

            let clearCart = ({ recipientPhone }) => {
                CustomerSession.get(recipientPhone).cart = [];
            };
            // End of cart logic

            if(typeOfMsg === 'text_message'){
                await Whatsapp.sendSimpleButtons({
                    message: 'Hello ' + recipientName + ' \nYou are speaking to a chatbot.\nWhat do you want to do next?',
                    recipientPhone: recipientPhone,
                    listOfButtons: [
                        {
                            title: 'View some products',
                            id:'see_categories',
                        },
                        {
                            title:'Speak to a human',
                            id:'speak_to_human',
                        }
                    ]
                })
            }
            if(typeOfMsg === 'simple_button_message'){
                let button_id = incomingMessage.button_reply.id;

                if(button_id === 'speak_to_human'){
                    await Whatsapp.sendText({
                        recipientPhone: recipientPhone,
                        message:`Arguably, chatbots are faster than humans.\nCall my human with the below details:`
                    });

                    await Whatsapp.sendContact({
                        recipientPhone: recipientPhone,
                        name: 'Human',
                        contact_profile:{
                            addresses:[
                                {
                                    city:'Nairobi',
                                    country:'Kenya',
                                },
                            ],
                            name: {
                                first_name: 'Collins',
                                last_name: 'Hillary',
                            },
                            org: {
                                company: 'Shop',
                            },
                            phones: [
                                {
                                    phone: '+1 (555) 025-3483',
                                },
                                                    {
                                    phone: '+254712345678',
                                },
                            ],
                        }
                        
                    })
                }
                
                if(button_id === 'see_categories'){
                    let categories = await Store.getAllCategories();
                    await Whatsapp.sendSimpleButtons({
                        message: 'We have several categories.\nChoose one of them.',
                        recipientPhone: recipientPhone,
                        listOfButtons: categories.data.map((category) => ({
                                title: category,
                                id: `category_${category}`,
            
                        })).slice(0,3)
                    })
                }

                if(button_id.startsWith('category_')){
                    let selectedCategory = button_id.split('category_')[1];
                    let listOfProducts = await Store.getProductsInCategory(selectedCategory);

                    let listOfSections = [
                        {
                            title: `🏆 Top 3: ${selectedCategory}`.substring(0,24),
                            rows: listOfProducts.data.slice(0,3).map((product) => {
                                let id = `product_${product.id}`.substring(0,256);
                                let title = product.title.substring(0,21);
                                let description = `${product.price}\n${product.description}`.substring(0,68);
                               
                                return {
                                    id,
                                    title: `${title}...`,
                                    description: `$${description}...`
                                };
                            }).slice(0,10)
                        }
                    ];

                    await Whatsapp.sendRadioButtons({
                        recipientPhone: recipientPhone,
                        headerText: `#BlackFriday Offers: ${selectedCategory}`,
                        bodyText: `Our Santa 🎅🏿 has lined up some great products for you based on your previous shopping history.\n\nPlease select one of the products below:`,
                        footerText: 'Powered by: BMI LLC',
                        listOfSections,
                    });
                }

                if (button_id.startsWith('add_to_cart_')) {
                    let product_id = button_id.split('add_to_cart_')[1];
                    await addToCart({ recipientPhone, product_id });
                    let numberOfItemsInCart = listOfItemsInCart({ recipientPhone }).count;
                
                    await Whatsapp.sendSimpleButtons({
                        message: `Your cart has been updated.\nNumber of items in cart: ${numberOfItemsInCart}.\n\nWhat do you want to do next?`,
                        recipientPhone: recipientPhone, 
                        listOfButtons: [
                            {
                                title: 'Checkout 🛍️',
                                id: `checkout`,
                            },
                            {
                                title: 'See more products',
                                id: 'see_categories',
                            },
                        ],
                    });
                }

                if (button_id === 'checkout') {
                    let finalBill = listOfItemsInCart({ recipientPhone });
                    let invoice_data = {}
                    invoice_data.date = new Date().toISOString();
                    invoice_data.time = new Date().toLocaleTimeString();
                    invoice_data.customer = {
                        name: recipientName,
                        phone: recipientPhone,
                    };
                    invoice_data.items = finalBill.products.map((product) => {
                        return {
                            name: product.title,
                            price: product.price,
                            quantity: 1,
                        }; 
                    });
                    invoice_data.invoice_nr = Math.floor(Math.random() * 1000000);
                  
                    Store.generatePDFInvoice({
                        order_details: invoice_data,
                        file_path: `./invoices/invoice_${recipientName}.pdf`,
                    });
                  
                  
                    await Whatsapp.sendSimpleButtons({
                        recipientPhone: recipientPhone,
                        message: `Thank you for shopping with us, ${recipientName}.\n\nYour order has been placed and invoice has been generated.`,
                        message_id,
                        listOfButtons: [
                            {
                                title: 'See more products',
                                id: 'see_categories',
                            },
                            {
                                title: 'Print my invoice',
                                id: 'print_invoice',
                            },
                        ],
                    });
                  
                    clearCart({ recipientPhone });
                }

                if (button_id === 'print_invoice') {
                    // Send the PDF invoice
                    await Whatsapp.sendDocument({
                        recipientPhone: recipientPhone,
                        caption:`Shop invoice #${recipientName}`,
                        file_path: `./invoices/invoice_${recipientName}.pdf`,
                    });
                  
                    // Send the location of our pickup station to the customer, so they can come and pick up their order
                    let warehouse = Store.generateRandomGeoLocation();
                  
                    await Whatsapp.sendText({
                        recipientPhone: recipientPhone,
                        message: `Your order has been fulfilled. Come and pick it up, as you pay, here:`,
                    });
                  
                    await Whatsapp.sendLocation({
                        recipientPhone,
                        latitude: warehouse.latitude,
                        longitude: warehouse.longitude,
                        address: warehouse.address,
                        name: 'Shop',
                    });
                  }
            }
            if(typeOfMsg === 'radio_button_message'){
                let selectionId = incomingMessage.list_reply.id;

                if (selectionId.startsWith('product_')) {
                    let product_id = selectionId.split('_')[1];
                    let product = await Store.getProductById(product_id);
                    const { price, title, description, category, image: imageUrl, rating } = product.data;
                
                    let emojiRating = (rvalue) => {
                        rvalue = Math.floor(rvalue || 0); // generate as many star emojis as whole number ratings
                        let output = [];
                        for (var i = 0; i < rvalue; i++) output.push('⭐');
                        return output.length ? output.join('') : 'N/A';
                    };
                
                    let text = `_Title_: *${title.trim()}*\n\n\n`;
                    text += `_Description_: ${description.trim()}\n\n\n`;
                    text += `_Price_: $${price}\n`;
                    text += `_Category_: ${category}\n`;
                    text += `${rating?.count || 0} shoppers liked this product.\n`;
                    text += `_Rated_: ${emojiRating(rating?.rate)}\n`;
                
                    await Whatsapp.sendImage({
                        recipientPhone,
                        url: imageUrl,
                        caption: text,
                    });
                
                    await Whatsapp.sendSimpleButtons({
                        message: `Here is the product, what do you want to do next?`,
                        recipientPhone: recipientPhone, 
                        listOfButtons: [
                            {
                                title: 'Add to cart🛒',
                                id: `add_to_cart_${product_id}`,
                            },
                            {
                                title: 'Speak to a human',
                                id: 'speak_to_human',
                            },
                            {
                                title: 'See more products',
                                id: 'see_categories',
                            },
                        ],
                    });
                }
            }
        
            await Whatsapp.markMessageAsRead({ message_id });
        }
        res.status(200).send('OK');
    }catch(err){
        console.log(err);
        res.status(500).send(err);
    }    
});

module.exports = router;