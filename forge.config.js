module.exports = {
  packagerConfig: {
    asar: true,
    "icon": "images\\icon.ico",
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        "setupIcon": "images\\icon.ico",
        "iconUrl": "https://www.iconarchive.com/download/i90049/icons8/windows-8/Astrology-Year-Of-Monkey.ico"
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
