const express = require('express');
const path = require('path');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security and SEO headers
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // SEO headers
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    next();
});

app.use(express.static('.'));

// Routes SEO
app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

// Route pour servir le site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour traiter le formulaire de contact
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation des données
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis.'
            });
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Adresse email invalide.'
            });
        }

        // Vérifier si SendGrid est configuré
        if (!process.env.SENDGRID_API_KEY) {
            console.log('Message de contact reçu:', { name, email, subject, message });
            return res.json({
                success: true,
                message: 'Message reçu ! (Configuration email en attente)'
            });
        }

        // Configuration de l'email
        const msg = {
            to: 'febon.s.daniel01@gmail.com', // Email de destination
            from: 'febon.s.daniel01@gmail.com', // Email vérifié dans SendGrid
            replyTo: email, // Email de l'expéditeur pour répondre
            subject: `Portfolio Contact: ${subject}`,
            text: `
Nouveau message de contact depuis le portfolio:

Nom: ${name}
Email: ${email}
Sujet: ${subject}

Message:
${message}

---
Envoyé depuis le portfolio de FEBON Sitou Daniel
            `,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; border-bottom: 2px solid #43e97b; padding-bottom: 10px;">
                        Nouveau message de contact
                    </h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Nom:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p><strong>Sujet:</strong> ${subject}</p>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-left: 4px solid #43e97b; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Message:</h3>
                        <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <footer style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777;">
                        <p>Envoyé depuis le portfolio de FEBON Sitou Daniel</p>
                    </footer>
                </div>
            `
        };

        // Envoyer l'email
        await sgMail.send(msg);
        
        res.json({
            success: true,
            message: 'Message envoyé avec succès ! Merci de m\'avoir contacté.'
        });

    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message. Veuillez réessayer.'
        });
    }
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur démarré sur http://0.0.0.0:${PORT}`);
    if (!process.env.SENDGRID_API_KEY) {
        console.log('⚠️  SENDGRID_API_KEY non configuré - les emails seront simulés');
    } else {
        console.log('✅ SendGrid configuré et prêt');
    }
});
