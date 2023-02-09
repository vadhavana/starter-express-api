const express = require("express");
// const dotenv = require("dotenv");
const sgMail = require("@sendgrid/mail");
const { body, validationResult } = require("express-validator");
const mysql = require('mysql2')
// dotenv.config();

const app = express();
app.use(express.json());

app.all("/", (req, res) => {
  console.log("Just got a request!");
  res.send("Yo! It is working!!!!");
});

app.post(
  "/subscribe-email-solutions",
  body("email").isEmail().normalizeEmail(),
  (req, res) => {
      const connection = mysql.createConnection(process.env.DB_URL)
      connection.execute(
        'INSERT INTO `agile-solutions-website-mailing-list` (email, created_at) VALUES (?,?);',
        [req.body.email, new Date().toISOString().slice(0, 19).replace('T', ' ')],
        function(err, results, fields) {
          if(results.affectedRows > 0) {
            res.sendStatus(202)
          }
          console.log(err);
        }
      );
    }
);

app.post(
  "/contact-us-email-solutions",
  body("name").not().isEmpty().trim().escape(),
  body("email").isEmail().normalizeEmail(),
  body("message").not().isEmpty().trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: process.env.TO_MAIL, // Change to your recipient
      from: process.env.FROM_MAIL, // Change to your verified sender
      subject: req.body.name + ": Agile Solutions Website Query",
      // text: "and easy to do anywhere, even with Node.js",
      html: `
      <table border="0" cellpadding="0" cellspacing="0">
        <tbody><tr>
            <td>
            <p>Hi Agile Solutions,</p><br><br>
            <table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                <tbody>
                <tr>
                    <td align="left">
                    <table border="0" cellpadding="0" cellspacing="0">
                        <tbody>
                        <tr>
                            <td><strong>Name</strong></td>
                            <td>${req.body.name}</td>
                        </tr>
                        <tr>
                            <td><strong>Email</strong></td>
                            <td>${req.body.email}</td>
                        </tr>
                        <tr>
                            <td><strong>Msg</strong></td>
                            <td>${req.body.message}</td>
                        </tr>
                        </tbody>
                    </table>
                    </td>
                </tr>
                </tbody>
            </table>
            </td>
        </tr>
        </tbody></table>`,
    };
    sgMail
      .send(msg)
      .then((data) => {
        res.send({
          body: data[0].body,
          statusCode: data[0].statusCode,
        });
      })
      .catch((error) => {
        res.status(403).send({
          message: error.message,
          code: error.code,
          body: error.response.body,
        });
      });
  }
);

app.listen(process.env.PORT);
