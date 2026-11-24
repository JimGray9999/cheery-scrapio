# Cheery Scrapio 📰

A news article aggregator (the UI is branded **Balance**) that collects articles from left, center and right sources and shows them side by side in one place.

## Features

- 🔍 **Multi-Source Collection**: The Guardian API (left), BBC News (center) and Free Republic (right)
- 💬 **Article Notes**: Add and delete a personal note on an article
- 🏷️ **Tags and Search**: Tag articles and search titles with MongoDB full-text search
- 📄 **Cursor Pagination**: 20 articles per column with a Load more button
- 🔐 **Security-First**: Environment-based configuration, Helmet CSP, input validation, rate limiting, optional scrape token
- 📊 **Filter by Perspective**: View articles filtered by political lean
- 🎯 **Duplicate Detection**: Smart deduplication prevents article repetition
- ✅ **Comprehensive Testing**: Full test coverage with Jest
- 🐳 **Docker Support**: Production-ready containerization

## Tech Stack

- **Backend**: Node.js 20+, Express 5
- **Database**: MongoDB with Mongoose ODM
- **View Engine**: Handlebars
- **Data sources**: Guardian API (Axios), Cheerio and Axios scraping for BBC and Free Republic
- **Testing**: Jest, Supertest
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **Logging**: Winston structured logging
- **Security**: Helmet, express-validator, express-rate-limit

## Architecture

```
cheery-scrapio/
├── config/              # Centralized configuration
├── controllers/         # HTTP request handlers
├── models/             # Mongoose schemas
├── routes/             # Express route definitions
├── middleware/         # Express middleware (scrape token gate)
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

- Node.js 20 or higher
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

   Copy `.env.example` to `.env`, or create it in the root directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/cheery-scrapio

   # Docker Compose only: MongoDB root credentials (MONGO_PASSWORD is required)
   MONGO_USERNAME=admin
   MONGO_PASSWORD=changeme

   # Left lane source: free key from https://open-platform.theguardian.com
   GUARDIAN_API_KEY=your-key

   # Optional: require this value in the x-scrape-token header on POST /scrape
   # SCRAPE_SECRET=

   # Optional: custom scraping URLs
   SCRAPE_URL_RIGHT=http://www.freerepublic.com/tag/breaking-news/index?tab=articles
   SCRAPE_URL_CENTER=http://www.bbc.com/news/world/us_and_canada
   ```

4. **Start MongoDB**

   Using Docker:

   ```bash
   docker-compose up -d mongodb
   ```

   The Compose MongoDB requires authentication, so set `MONGODB_URI` to
   `mongodb://admin:<MONGO_PASSWORD>@localhost:27017/cheery-scrapio?authSource=admin`.
   With a local MongoDB installation without auth, the plain URI above works.

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
- `GET /articles/:id` - View one article
- `GET /api/articles?filter=left|center|right&before=<_id>` - Cursor-paginated JSON (20 per page)
- `GET /api/search?q=<query>&filter=left|center|right` - Full-text title search
- `GET /api/tags` - All tags in use
- `PUT /articles/:id/tags` - Replace an article's tags (max 20 tags, 50 characters each)
- `POST /articles/:id` - Add a note to an article (title 3-100 chars, text 10-1000 chars)
- `DELETE /articles/:id/note` - Delete the note from an article

### Scraping

- `POST /scrape` - Run all three sources (left, right, center), then redirect to `/all`.
  Rate limited to 1 request per minute in production (10 otherwise). If `SCRAPE_SECRET` is set,
  send it as the `x-scrape-token` header or the request gets a 401, and the in-app Refresh News
  buttons are hidden:

  ```bash
  curl -X POST -H "x-scrape-token: $SCRAPE_SECRET" http://localhost:5000/scrape
  ```

### Health

- `GET /health` - Health check endpoint (returns `{"status": "ok"}`)

## Configuration

All configuration is managed through environment variables in `.env`:

| Variable            | Default                              | Description                                                     |
| ------------------- | ------------------------------------ | --------------------------------------------------------------- |
| `NODE_ENV`          | `development`                        | Environment mode                                                |
| `PORT`              | `5000`                               | Server port                                                     |
| `MONGODB_URI`       | `mongodb://localhost/cheery-scrapio` | MongoDB connection string (Compose builds an authenticated one) |
| `MONGO_USERNAME`    | `admin`                              | Docker Compose MongoDB root user                                |
| `MONGO_PASSWORD`    | none (required by Compose)           | Docker Compose MongoDB root password                            |
| `GUARDIAN_API_KEY`  | `test`                               | Guardian API key for the left lane                              |
| `SCRAPE_SECRET`     | unset                                | When set, `POST /scrape` requires a matching `x-scrape-token`   |
| `SCRAPE_URL_RIGHT`  | Free Republic URL                    | Right-leaning news source                                       |
| `SCRAPE_URL_CENTER` | BBC News URL                         | Center news source                                              |
| `LOG_LEVEL`         | `info`                               | Winston log level                                               |
| `LOG_FILE`          | `logs/app.log`                       | Application log file                                            |

## Testing

The project includes comprehensive unit and integration tests:

- **Controller Tests**: HTTP request/response logic
- **Service Tests**: Scraping and data processing
- **Integration Tests**: End-to-end API testing

Coverage thresholds (enforced in `jest.config.js`): 78% lines and statements, 70% functions, 60% branches.

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
- Keep coverage above the thresholds in `jest.config.js` (`npm run test:coverage` enforces them)
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

- [The Guardian Open Platform](https://open-platform.theguardian.com)
- [Free Republic](https://www.freerepublic.com)
- [BBC News](https://www.bbc.com/news)
