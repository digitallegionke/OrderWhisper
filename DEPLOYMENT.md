# OrderWhisper Deployment Guide

## Prerequisites

- Node.js (^18.20 || ^20.10 || >=21.0.0)
- PostgreSQL 15+
- Redis 7+
- Shopify Partner Account
- WhatsApp Business API access
- Render.com account

## Environment Setup

### Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/orderwhisper.git
   cd orderwhisper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment template:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`

5. Set up local database:
   ```bash
   npx prisma migrate dev
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

### Production Environment (Render)

1. Fork or clone the repository to your GitHub account

2. Create a new Web Service in Render:
   - Connect your GitHub repository
   - Select the `main` branch
   - Choose "Node" as environment
   - Use the following build settings:
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`

3. Configure environment variables in Render dashboard:
   - Copy all variables from `.env.example`
   - Set appropriate production values
   - Ensure `NODE_ENV=production`

4. Set up database and Redis:
   - Create a PostgreSQL database in Render
   - Create a Redis instance in Render
   - Environment variables will be automatically configured

5. Deploy the application:
   - Render will automatically deploy when you push to main
   - Monitor the deployment logs for any issues

## Configuration Files

### render.yaml
- Defines service configuration
- Specifies environment variables
- Sets up database and Redis instances

### shopify.app.orderwhisper.toml
- Configures Shopify app settings
- Defines app scopes and URLs
- Manages authentication settings

## Security Considerations

1. Environment Variables:
   - Never commit `.env` files
   - Use different values for each environment
   - Regularly rotate sensitive keys

2. Database:
   - Enable SSL in production
   - Use strong passwords
   - Regular backups

3. Redis:
   - Enable SSL in production
   - Set maxmemory policy
   - Configure persistence

## Monitoring and Maintenance

1. Health Checks:
   - Monitor `/healthcheck` endpoint
   - Set up uptime monitoring
   - Configure alert notifications

2. Logs:
   - Monitor application logs in Render
   - Set up error tracking
   - Regular log analysis

3. Database:
   - Monitor database performance
   - Regular maintenance
   - Backup verification

## Troubleshooting

1. Deployment Issues:
   - Check build logs
   - Verify environment variables
   - Confirm database connections

2. Runtime Issues:
   - Check application logs
   - Monitor error rates
   - Verify Redis connection

3. Shopify Integration:
   - Verify app credentials
   - Check webhook configurations
   - Monitor API rate limits

4. WhatsApp Integration:
   - Verify API credentials
   - Monitor message delivery
   - Check rate limits

## Scaling Considerations

1. Database:
   - Monitor connection pool
   - Index optimization
   - Query performance

2. Redis:
   - Memory usage monitoring
   - Cache optimization
   - Connection pool settings

3. Application:
   - Load balancing
   - Rate limiting
   - Resource allocation

## Support and Resources

- GitHub Repository: [Link]
- Issue Tracker: [Link]
- Documentation: [Link]
- Contact: [Email] 