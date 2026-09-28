import { Issuer, generators } from 'openid-client';
import Buyer from '../models/buyer.model.js';
import { generateToken } from '../utils/generateToken.js';

let wso2Client;

// Initialize the WSO2 Client lazily (this ensures .env variables are fully loaded first)
async function getWSO2Client() {
    if (wso2Client) return wso2Client;
    
    if (!process.env.WSO2_ISSUER_URL || !process.env.WSO2_CLIENT_ID || !process.env.WSO2_CLIENT_SECRET) {
        throw new Error('WSO2 OIDC credentials not fully configured in .env');
    }

    const wso2Issuer = await Issuer.discover(process.env.WSO2_ISSUER_URL);
    wso2Client = new wso2Issuer.Client({
        client_id: process.env.WSO2_CLIENT_ID,
        client_secret: process.env.WSO2_CLIENT_SECRET,
        redirect_uris: [process.env.WSO2_REDIRECT_URI || 'http://localhost:5000/api/buyers/auth/wso2/callback'],
        response_types: ['code'],
    });
    console.log('WSO2 OIDC Client initialized successfully');
    return wso2Client;
}

export const loginWSO2 = async (req, res) => {
    try {
        const client = await getWSO2Client();

        const code_verifier = generators.codeVerifier();
        const code_challenge = generators.codeChallenge(code_verifier);
        
        // Store verifier in a secure, HTTP-only cookie for the callback phase
        res.cookie('code_verifier', code_verifier, { httpOnly: true, maxAge: 15 * 60 * 1000 });

        const authUrl = client.authorizationUrl({
            scope: 'openid profile email',
            code_challenge,
            code_challenge_method: 'S256',
        });

        res.redirect(authUrl);
    } catch (error) {
        console.error('Login initialization error:', error.message);
        res.status(500).json({ message: 'WSO2 client initialization failed: ' + error.message });
    }
};

export const callbackWSO2 = async (req, res, next) => {
    try {
        const client = await getWSO2Client();

        const params = client.callbackParams(req);
        const code_verifier = req.cookies.code_verifier;

        const redirectUri = process.env.WSO2_REDIRECT_URI || 'http://localhost:5000/api/buyers/auth/wso2/callback';
        
        // Exchange code for tokens
        const tokenSet = await client.callback(redirectUri, params, { code_verifier });
        
        // Extract user information from the ID Token
        const claims = tokenSet.claims();
        const { email, given_name, family_name, name } = claims;

        if (!email) {
            throw new Error('Email claim not found in WSO2 ID token');
        }

        // Find or create the user in your database
        let user = await Buyer.findOne({ email });

        if (!user) {
            // Determine full name
            const fullName = name || `${given_name || ''} ${family_name || ''}`.trim() || 'WSO2 User';
            
            // JIT Provisioning: Create a new user if they don't exist
            // Set a random robust dummy password since they authenticate via WSO2
            user = new Buyer({
                name: fullName,
                email: email,
                password: Math.random().toString(36).slice(-10) + 'Aa1!' 
            });
            await user.save();
        }

        // Clear the temporary OIDC cookie
        res.clearCookie('code_verifier');

        // Issue your application's JWT so the rest of the app works normally
        generateToken(req, res, user._id);

        // Redirect back to your frontend application
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/buyer/profile`);
        
    } catch (error) {
        console.error("WSO2 Authentication Error:", error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
};
