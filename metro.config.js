const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver problemas com AsyncStorage na web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Se for web, retorne um módulo vazio para AsyncStorage
  if (platform === 'web') {
    if (moduleName === '@react-native-async-storage/async-storage') {
      return {
        type: 'empty',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Configurações adicionais
config.transformer.minifierConfig = {
  compress: {
    drop_console: true, // Remove console.log em produção
  },
};

module.exports = config;