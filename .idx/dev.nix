{ pkgs, ... }: {
  channel = "unstable"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.zip
    pkgs.openssl.dev
    pkgs.bun
  ];

  env = {};

  idx = {
    extensions = [
      "esbenp.prettier-vscode"
    ];
    
    workspace = {
      onCreate = {
        # Example: install JS dependencies from NPM
        npm-install = "bun i";
        # Open editors for the following files by default, if they exist:
        default.openFiles = [ ".idx/dev.nix" "README.md" ];
      };
      
      onStart = {
        # Example: start a background task to watch and re-build backend code
        # watch-backend = "npm run watch-backend";
      };
    };
  };
}