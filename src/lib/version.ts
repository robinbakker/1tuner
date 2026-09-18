// Import version from package.json
import packageJson from '../../package.json' with { type: 'json' };

export const APP_VERSION = packageJson.version;
