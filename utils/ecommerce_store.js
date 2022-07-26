'use strict';

const request = require('request');
const PDFDocument = require('pdfkit');
const fs = require('fs');

module.exports = class EcommerceStore{
    constructor(){
    }

    async _fetchAssistant(endpoint){
        return new Promise((resolve, reject) => {
            request(`https://fakestoreapi.com${endpoint ? endpoint : '/'}`
            , (err, res, body) => {
                try {
                    if(err){
                        reject(err);
                    }else{
                        resolve({
                            status:'success',
                            data:JSON.parse(body)
                        });
                    }
                } catch (error) {
                    reject(error);
                }
              
            });
        });
    }

    async getProductById(productId){
        return await this._fetchAssistant(`/products/${productId}`);
    }

    async getAllCategories(){
        return await this._fetchAssistant('/products/categories?limit=100');
    }

    async getProductsInCategory(categoryId){
        return await this._fetchAssistant(`/products/category/${categoryId}?limit=100`);
    }


    generatePDFInvoice({order_details,file_path}){
        const doc = new PDFDocument({ margin: 50 });
        generateHeader(doc);
        generateCustomerInformation(doc, order_details);
        // generateInvoiceTable(doc, invoice);
        generateFooter(doc);

        doc.pipe(fs.createWriteStream(file_path));
        doc.fontSize(25);
        // doc.text(order_details,100,100);
        doc.end();
        return;
    }
    generateRandomGeoLocation() {
        let storeLocations = [
            {
                latitude: 44.985613,
                longitude: 20.1568773,
                address: 'New Castle',
            },
            {
                latitude: 36.929749,
                longitude: 98.480195,
                address: 'Glacier Hill',
            },
            {
                latitude: 28.91667,
                longitude: 30.85,
                address: 'Buena Vista',
            },
        ];
        return storeLocations[
            Math.floor(Math.random() * storeLocations.length)
        ];
    }
}

function generateHeader(doc) {
    doc.image('./images/logo.png', 50, 45, { width: 50 })
        .fillColor('#444444')
        .fontSize(20)
        .text('Devligence Limited.', 110, 57)
        .fontSize(10)
        .text('123 Main Street', 200, 65, { align: 'right' })
        .text('New York, NY, 10025', 200, 80, { align: 'right' })
        .moveDown();
}

function generateCustomerInformation(doc, order_details) {
    console.log(order_details,100,100)
    // const shipping = invoice.shipping;

    // doc.text(`Invoice Number: ${invoice.invoice_nr}`, 50, 200)
    //     .text(`Invoice Date: ${new Date()}`, 50, 215)
    //     .text(`Balance Due: ${invoice.subtotal - invoice.paid}`, 50, 130)

    //     .text(shipping.name, 300, 200)
    //     .text(shipping.address, 300, 215)
    //     .text(
    //         `${shipping.city}, ${shipping.state}, ${shipping.country}`,
    //         300,
    //         130,
    //     )
    doc.text(order_details,100,100).moveDown();
}
// generateInvoiceTable(doc, invoice) {
//     let i,
//         invoiceTableTop = 330;

//     for (i = 0; i < invoice.items.length; i++) {
//         const item = invoice.items[i];
//         const position = invoiceTableTop + (i + 1) * 30;
//         generateTableRow(
//             doc,
//             position,
//             item.item,
//             item.description,
//             item.amount / item.quantity,
//             item.quantity,
//             item.amount,
//         );
//     }
// }
// generateTableRow(doc, y, c1, c2, c3, c4, c5) {
//     doc.fontSize(10)
//         .text(c1, 50, y)
//         .text(c2, 150, y)
//         .text(c3, 280, y, { width: 90, align: 'right' })
//         .text(c4, 370, y, { width: 90, align: 'right' })
//         .text(c5, 0, y, { align: 'right' });
// }


function generateFooter(doc) {
    doc.fontSize(
        10,
    ).text(
        'Payment is due within 15 days. Thank you for your business.',
        50,
        780,
        { align: 'center', width: 500 },
    );
}
