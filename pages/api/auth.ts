import { NextApiRequest, NextApiResponse } from 'next';
import { encodePayload, getBCAuth, setSession } from '../../lib/auth';

const carrierConnectionURL = `https://api.bigcommerce.com/stores/${process.env.STORE_HASH}/v2/shipping/carrier/connection`;
const shippingZonesURL = `https://api.bigcommerce.com/stores/${process.env.STORE_HASH}/v2/shipping/zones`;
const carrierConnectionBody = {
    "carrier_id" : process.env.CARRIER_ID,
    "connection" : {}
}
const zoneBody = {
    "name": "TRR Shipping Rates",
    "type": process.env.CARRIER_ID,
    "enabled": true
  }


export default async function auth(req: NextApiRequest, res: NextApiResponse) {
    console.log("/api/auth: Processing request", req);

    try {
        console.log("/api/auth: Creating BigCommerce session (getBCAuth)...", req.query);
        // Authenticate the app on install
        const session = await getBCAuth(req.query);
        console.log("/api/auth: BigCommerce session created", session);
        console.log("/api/auth: Encoding session payload (encodePayload)...");
        const encodedContext = encodePayload(session); // Signed JWT to validate/ prevent tampering
        console.log("/api/auth: Encoded context JWT", encodedContext);

        console.log("/api/auth: Creating carrier connection...");
        console.log(`/api/auth: Calling ${carrierConnectionURL} with POST and body`, carrierConnectionBody);
        // Create Carrier Connection
        await fetch(carrierConnectionURL, renderOptions('POST', carrierConnectionBody));
        console.log("/api/auth: Carrier connection created");

        console.log("/api/auth: Fetching shipping zones...");
        // Get Shipping Zones
        const shippingZones = await getShippingZones();
        console.log("/api/auth: Shipping zones fetched", shippingZones);

        const shippingZoneIds = shippingZones.map((shippingZone: any) => shippingZone.id);

        console.log("/api/auth: Creating shipping method for each shipping zone...")
        // Create Shipping Method For Each Zone
        shippingZoneIds.forEach((id: number) => {
            const zoneURL = `https://api.bigcommerce.com/stores/${process.env.STORE_HASH}/v2/shipping/zones${id}/methods`

            console.log(`/api/auth: Creating shipping method for zone ${id}...`);
            console.log(`/api/auth: Calling ${zoneURL}...`);
            fetch(zoneURL, renderOptions('POST', zoneBody));
            console.log(`/api/auth: Created shipping method for zone ${id}`);
        });

        console.log("/api/auth: Saving session in database...", session);
        await setSession(session);
        console.log("/api/auth: Session saved in database");
        console.log(`/api/auth: Responding HTTP 302 redirect to /?context=${encodedContext}`);
        res.redirect(302, `/?context=${encodedContext}`);
    } catch (error) {
        console.error("/api/auth: Error occurred while processing request", error);
        const { message, response } = error;
        console.log("/api/auth: Responding HTTP 500");
        res.status(response?.status || 500).json({ message });
    }
}

async function getShippingZones() {
    const response = await fetch(shippingZonesURL, renderOptions('GET', carrierConnectionBody));
    const zones = await response.json();
    
    return zones;
}

function renderOptions(method: string, body: any) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Auth-Token": process.env.ACCESS_TOKEN
        }
    }

    if(body) {
        options['body'] = JSON.stringify(body)
    }

    console.log("/api/auth: Options for fetch", options);

    return options;
}
