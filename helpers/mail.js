import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD
    },
});

function sendMail(message) {
    console.log(message);
    return transport.sendMail(message).then(console.log).catch(console.error);
};

export default { sendMail };