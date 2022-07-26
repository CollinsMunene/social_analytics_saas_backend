const production = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
}

const development = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: '9000',
    Meta_WA_accessToken: 'EAARgRtf10bsBAAZAqN1221xVc9ncCoZCWQjgUibgmCZBNMdZCHIOEq5vmHnoVi50dB9s4RSKQPleuQOALTlH72XuwAZCAmKFwoByCfXYy8HSRNw67JlxLcC32ZCF5dLG9Ubtq2voMeox6OXaVyWoZCEAFlAjbQ8cZCyyM6gPkB6ZBasQVeR9ia1yKUbap0XeQmhDwUGxZAnRSZAM1ZBoZCK2a6tCH', //temporary access token
    Meta_WA_SenderPhoneNumberId: '102651369169343', //phone number id
    Meta_WA_wabaId: '108974105190324',//business account ID
    Meta_Wa_VerifyToken: 'YoucanSetYourOwnToekn', //self defined
};

const fallback = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'fallback',
};

module.exports =(environment) => {
    console.log(`Environment: ${environment}`);
    switch (environment) {
        case 'production':
            return production;
        case 'development':
            return development;
        case 'fallback':
            return fallback;
        default:
            return fallback;
    }
}