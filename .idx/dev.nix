{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.docker
  ];
  idx = {
    extensions = [
      "usernamehw.errorlens"
      "esbenp.prettier-vscode"
    ];
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}