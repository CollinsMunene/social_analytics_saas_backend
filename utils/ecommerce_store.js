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
        generateInvoiceTable(doc, order_details);
        generateFooter(doc);

        doc.pipe(fs.createWriteStream(file_path));
        doc.fontSize(25);
        
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
    doc.image('./images/logo.png', 50, 65, { width: 90 })
        .fillColor('#444444')
        .fontSize(20)
        .text('Devligence Limited.', 160, 65)
        .fontSize(10)
        .text('Nairobi, Kenya', 200, 65, { align: 'right' })
        .text('Nairobi, KE, 10025', 200, 80, { align: 'right' })
        .moveDown();
}

function generateCustomerInformation(doc, order_details) {
    console.log(order_details,100,100)
    doc.fillColor('#444444')
        .fontSize(20)
        .text('Invoice', 50, 160);

    generateHr(doc,185);

    const customerInformationTop = 200;

    doc.fontSize(10)
        .text("Invoice Number:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(order_details.invoice_nr, 150, customerInformationTop)
        .font("Helvetica")
        .text("Invoice Date:", 50, customerInformationTop + 15)
        .text(formatDate(new Date()), 150, customerInformationTop + 15)

        generateHr(doc,252);
}

function generateInvoiceTable(doc, invoice) {
    let i,
        invoiceTableTop = 330;

    doc.font("Helvetica-Bold");
    generateTableRow(
          doc,
          invoiceTableTop,
          "Item",
          "Unit Cost",
          "Quantity",
          "Line Total"
        );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            position,
            item.name,
            formatCurrency(item.price),
            item.quantity,
            formatCurrency(item.quantity * item.price)
        );
        generateHr(doc,position + 20);
    }
    
    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      subtotalPosition,
      "",
      "",
      "Subtotal",
      "",
      formatCurrency(invoice.subtotal)
    );
  
    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      paidToDatePosition,
      "",
      "",
      "Paid To Date",
      "",
      formatCurrency(invoice.paid)
    );
  
    const duePosition = paidToDatePosition + 25;
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      duePosition,
      "",
      "",
      "Balance Due",
      "",
      formatCurrency(invoice.subtotal - invoice.paid)
    );
    doc.font("Helvetica");
}

function generateFooter(doc) {
    doc.fontSize(
        10,
    ).text(
        'Payment is due within 15 days. Thank you for your business.',
        50,
        680,
        { align: 'center', width: 500 },
    );
}

function generateTableRow(
    doc,
    y,
    item,
    unitCost,
    quantity,
    lineTotal
  ) {
    doc
      .fontSize(10)
      .text(item, 50, y)
      .text(unitCost, 280, y, { width: 90, align: "right" })
      .text(quantity, 370, y, { width: 90, align: "right" })
      .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(cents) {
    return "$" + (cents / 100).toFixed(2);
  }
  
function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
  
    return year + "/" + month + "/" + day;
  }
