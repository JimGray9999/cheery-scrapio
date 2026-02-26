# Cheery Scrapio 📰

A news article aggregator that scrapes articles from different political perspectives, allowing users to view news from left, right, and center sources in one place.

## Features

- 🔍 **Multi-Source Scraping**: Aggregates articles from Democratic Underground (left), Free Republic (right), and BBC News (center)
- 💬 **Article Comments**: Add and manage personal notes/comments on articles
- 🔐 **Security-First**: Environment-based configuration, Helmet security headers, input validation
- 📊 **Filter by Perspective**: View articles filtered by political lean
- 🎯 **Duplicate Detection**: Smart deduplication prevents article repetition
- ✅ **Comprehensive Testing**: Full test coverage with Jest
- 🐳 **Docker Support**: Production-ready containerization
- 🚀 **Automated Deployment**: GitHub Actions deployment to Railway

## Tech Stack

- **Backend**: Node.js 18+, Express 5
- **Database**: MongoDB with Mongoose ODM
- **View Engine**: Handlebars
- **Scraping**: Cheerio, Axios
- **Testing**: Jest, Supertest
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **Logging**: Winston structured logging
- **Security**: Helmet, express-validator

## Architecture

```
cheery-scrapio/
├── config/              # Centralized configuration
├── controllers/         # HTTP request handlers
├── models/             # Mongoose schemas
├── routes/             # Express route definitions
├── services/           # Business logic (scraping)
├── utils/              # Utilities (logger)
├── views/              # Handlebars templates
├── public/             # Static assets
└── __tests__/          # Test suites
```

The application follows an **MVC + Services** architecture:

- **Models**: Define data schemas (Article, Note)
- **Views**: Handlebars templates for UI
- **Controllers**: Thin HTTP layer, delegates to services
- **Services**: All scraping business logic
- **Routes**: Define API endpoints and validation

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB 4.0 or higher (or use Docker Compose)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/JimGray9999/cheery-scrapio.git
   cd cheery-scrapio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/cheery-scrapio

   # Optional: Custom scraping URLs
   SCRAPE_URL_LEFT=https://www.democraticunderground.com/?com=forum&id=1014
   SCRAPE_URL_RIGHT=http://www.freerepublic.com/tag/breaking-news/index?tab=articles
   SCRAPE_URL_CENTER=http://www.bbc.com/news/world/us_and_canada
   ```

4. **Start MongoDB**

   Using Docker:

   ```bash
   docker-compose up -d mongodb
   ```

   Or use local MongoDB installation

5. **Run the application**

   ```bash
   npm start        # Production mode
   npm run dev      # Development mode with nodemon
   ```

6. **Visit the application**

   Open [http://localhost:5000](http://localhost:5000)

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

This will start both MongoDB and the application in containers.

### Manual Docker Build

```bash
# Build the image
docker build -t cheery-scrapio .

# Run with external MongoDB
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/cheery-scrapio \
  --name cheery-scrapio \
  cheery-scrapio
```

## Production Deployment

### Railway (Recommended)

This project includes automated deployment to Railway via GitHub Actions.

**Quick Start:**

1. Sign up at [Railway.app](https://railway.app)
2. Create a new project and add MongoDB
3. Add GitHub secrets (see below)
4. Push to main branch - automatic deployment! 🚀

**Required GitHub Secrets:**

- `RAILWAY_TOKEN` - Your Railway API token
- `RAILWAY_APP_URL` - Your Railway app URL

📖 **Full deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions.

**Features:**

- ✅ Automatic deployment on push to main
- ✅ Zero-downtime deployments
- ✅ Health checks after deployment
- ✅ Docker-based deployment
- ✅ MongoDB included

## Development

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Code Quality

```bash
npm run lint          # Check code style
npm run lint:fix      # Auto-fix code style issues
npm run format        # Format code with Prettier
```

Pre-commit hooks automatically run linting and formatting on staged files.

### Project Scripts

| Script                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm start`             | Start production server                   |
| `npm run dev`           | Start development server with auto-reload |
| `npm test`              | Run test suite                            |
| `npm run test:watch`    | Run tests in watch mode                   |
| `npm run test:coverage` | Generate test coverage report             |
| `npm run lint`          | Check code for style issues               |
| `npm run lint:fix`      | Auto-fix linting issues                   |
| `npm run format`        | Format code with Prettier                 |
| `npm run audit`         | Check for security vulnerabilities        |

## API Endpoints

### Articles

- `GET /` - Home page with all articles
- `GET /all` - View all articles
- `GET /left` - View left-leaning articles
- `GET /right` - View right-leaning articles
- `POST /articles/:id` - Add note/comment to article
- `DELETE /articles/:id/note` - Delete note from article

### Scraping

- `GET /scrape/left` - Trigger left article scrape
- `GET /scrape/right` - Trigger right article scrape
- `GET /scrape/news/center` - Trigger center (BBC) article scrape

### Health

- `GET /health` - Health check endpoint (returns `{"status": "ok"}`)

## Configuration

All configuration is managed through environment variables in `.env`:

| Variable            | Default                                    | Description               |
| ------------------- | ------------------------------------------ | ------------------------- |
| `NODE_ENV`          | `development`                              | Environment mode          |
| `PORT`              | `5000`                                     | Server port               |
| `MONGODB_URI`       | `mongodb://localhost:27017/cheery-scrapio` | MongoDB connection string |
| `SCRAPE_URL_LEFT`   | Democratic Underground URL                 | Left-leaning news source  |
| `SCRAPE_URL_RIGHT`  | Free Republic URL                          | Right-leaning news source |
| `SCRAPE_URL_CENTER` | BBC News URL                               | Center news source        |

## Testing

The project includes comprehensive unit and integration tests:

- **Controller Tests**: HTTP request/response logic
- **Service Tests**: Scraping and data processing
- **Integration Tests**: End-to-end API testing

Test coverage targets: 70% across branches, functions, lines, and statements.

## Security

- ✅ All dependencies regularly updated (zero vulnerabilities)
- ✅ Helmet middleware for security headers
- ✅ Input validation with express-validator
- ✅ Environment-based secrets management
- ✅ Non-root Docker user
- ✅ No sensitive data in repository

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow ESLint and Prettier configurations
- Write tests for new features
- Maintain test coverage above 70%
- Use meaningful commit messages

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb
```

### Port Already in Use

If port 5000 is already in use, change the `PORT` in your `.env` file.

### Scraping Failures

Scraping may fail if source websites change their HTML structure. Check logs:

```bash
tail -f logs/app.log
```

## Future Enhancements

- [ ] User authentication and personal article collections
- [ ] RSS feed support
- [ ] Scheduled automatic scraping (cron jobs)
- [ ] Full-text article content extraction
- [ ] Sentiment analysis
- [ ] Integration with Fact Check and AllSides
- [ ] Progressive Web App (PWA) support

## License

ISC

## Links

- **Repository**: [https://github.com/JimGray9999/cheery-scrapio](https://github.com/JimGray9999/cheery-scrapio)
- **Issues**: [https://github.com/JimGray9999/cheery-scrapio/issues](https://github.com/JimGray9999/cheery-scrapio/issues)

## Acknowledgments

Built with data from:

- [Democratic Underground](https://www.democraticunderground.com)
- [Free Republic](https://www.freerepublic.com)
- [BBC News](https://www.bbc.com/news)
