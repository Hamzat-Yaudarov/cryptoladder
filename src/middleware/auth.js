import crypto from 'crypto';
import { UserService } from '../services/userService.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const initData = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate Telegram Web App data
    const isValid = validateTelegramWebAppData(initData);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    // Parse init data
    const data = new URLSearchParams(initData);
    const user = JSON.parse(data.get('user'));

    // Get or create user
    let dbUser = await UserService.getUserByTelegramId(user.id);
    if (!dbUser) {
      dbUser = await UserService.createUser(
        user.id,
        user.username || null,
        user.first_name,
        user.last_name || null
      );
    }

    // Attach user ID to request
    req.userId = dbUser.id;
    req.telegramId = user.id;
    req.user = user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

function validateTelegramWebAppData(initData) {
  try {
    const data = new URLSearchParams(initData);
    const hash = data.get('hash');
    data.delete('hash');

    // Create data check string
    const dataCheckString = Array.from(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Verify signature
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return computedHash === hash;
  } catch (error) {
    console.error('Telegram data validation error:', error);
    return false;
  }
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
