# Linux server first-hour checklist

What I run on a fresh Ubuntu server before it does anything real. Adjust to taste.

## 1. Update everything

    sudo apt update && sudo apt full-upgrade -y
    sudo reboot   # if the kernel changed

## 2. Make a normal user

    sudo adduser jk
    sudo usermod -aG sudo jk

Log back in as that user. Stop using root directly.

## 3. Lock down SSH

Copy your key up first:

    ssh-copy-id jk@server

Then in /etc/ssh/sshd_config set:

    PermitRootLogin no
    PasswordAuthentication no
    PubkeyAuthentication yes

Reload:

    sudo systemctl reload ssh

## 4. Firewall

    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow OpenSSH
    sudo ufw enable

Open other ports only when you actually need them.

## 5. Automatic security updates

    sudo apt install -y unattended-upgrades
    sudo dpkg-reconfigure --priority=low unattended-upgrades

## 6. fail2ban

    sudo apt install -y fail2ban
    sudo systemctl enable --now fail2ban

## 7. Basics for later

- Set the hostname and timezone
- Add swap if the box has little RAM
- Decide where backups go and test a restore, not just a backup
