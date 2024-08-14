import { NextApiRequest, NextApiResponse } from 'next';
import pino from 'pino';

const logger = pino({
    prettyPrint: { colorize: true }
});

export default async function rate(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Log the incoming request payload
        logger.info('Received /rate request with payload:', req.body);

        // WIP - hardcoded response for the moment.
        res.status(200).json({
            quote_id: 'sample_shipping_provider',
            messages: [{
                text: 'Hello from Sample Shipping Provider',
                type: 'INFO'
            }],
            carrier_quotes: [
                {
                    quotes: [
                        {
                            code: 'USPS',
                            display_name: 'USPS - Priority',
                            cost: {
                                currency: 'USD',
                                amount: 5.99
                            }
                        },
                        {
                            code: 'SAMP',
                            display_name: 'Sample Express',
                            cost: {
                                currency: 'AUD',
                                amount: 19.99
                            }
                        },
                        {
                            code: 'FEDX1',
                            display_name: 'FedEx Ground',
                            cost: {
                                currency: 'USD',
                                amount: 1.99
                            }
                        },
                        {
                            code: 'FEDX2',
                            display_name: 'FedEx 2-Day Air',
                            cost: {
                                currency: 'USD',
                                amount: 15.99
                            }
                        }
                    ]
                }
            ]
        });
    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }
}