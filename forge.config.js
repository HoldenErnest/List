module.exports = {
  packagerConfig: {
    asar: true,
    "icon": "images\\icon",
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        "setupIcon": "images\\icon.ico",
        "iconUrl": "https://raw.githubusercontent.com/HoldenErnest/List/refs/heads/clientDevs/Images/icon.ico"
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Holden Ernest',
          icon: "Images/icon.png"
        }
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}, 
    },
  ],
};
