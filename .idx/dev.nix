{ pkgs, ... }: {
  channel = "stable-24.11";
  packages = [
    pkgs.nodejs_20
    pkgs.docker
    pkgs.docker-compose
  ];
  idx = {
    extensions = [
      "bradlc.vscode-tailwindcss"
      "dsznajder.es7-react-js-snippets"
    ];
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      onStart = {
        # Add any startup commands here
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm", "run", "dev", "--", "--port", "$PORT", "--hostname", "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
