{ pkgs, ... }: {
  channel = "stable-24.11";
  packages = [
    pkgs.nodejs_20
    pkgs.docker
    pkgs.sudo
  ];
  idx = {
    extensions = [
    ];
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "-p" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
