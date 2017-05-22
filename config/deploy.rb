lock '3.8.1'

# Application #
#####################################################################################
set :application,     'UNDG-Portal'
set :branch,          ENV["branch"] || "master"
set :user,            ENV["user"] || ENV["USER"] || "dportal"
#set :default_env, {"PATH" => "PATH=$PATH:/home/undg/.nvm/versions/node/v5.7.0/bin"}
set :default_env, {"PATH" => "PATH=$PATH:/home/undg/usr/bin/node"}
set :port,            ENV["port"] || "1337"

# SCM #
#####################################################################################
set :repo_url,        'git@github.com:younginnovations/UN-Transparency-Portal.git'
set :scm,             :git
set :repo_base_url,   :'https://github.com/younginnovations/UN-Transparency-Portal'
#set :repo_diff_path,  :'web-apps/devcheck-new/compare/master...'

# Multistage Deployment #
#####################################################################################
set :stages,              %w(demo stage production)
set :default_stage,       "stage"

# Other Options #
#####################################################################################
set :ssh_options,         { :forward_agent => true }
set :default_run_options, { :pty => true }

# Permissions #
#####################################################################################
set :use_sudo,            false
set :permission_method,   :acl
set :use_set_permissions, true
set :webserver_user,      "www-data"
set :group,               "www-data"
set :keep_releases,       5

# Create ver.txt #
#######################################################################################
require 'date'
set :current_time, DateTime.now

namespace :app_stop do
    desc 'stop node server'
        task :stop do
            on roles(:all) do
            within current_path do
                execute :chmod, "755", "./node-restart.sh"
                execute :"#{current_path}/node-restart.sh #{fetch(:port)}"
            end
        end
    end
end

namespace :install_dependency do
    desc 'stop node server'
        task :install do
            on roles(:all) do
            within current_path do
                execute :"./install_deps"
            end
        end
    end
end

namespace :app_build do
    desc 'start node server'
        task :build do
            on roles(:all) do
            within current_path do
                execute :"./serv"
            end
        end
    end
end

namespace :app_restart do
    desc 'start node server'
        task :start do
            on roles(:all) do
            within current_path do
               execute :"nohup /home/undg/.nvm/versions/node/v5.2.0/bin/node #{current_path}/dportal/js/serv.js --port=#{fetch(:port)} > #{current_path}/serve-log.log  &"
            end
        end
    end
end

namespace :dportal do
    desc 'Symbolic link for shared folders'
        task :create_symlink do
            on roles(:all) do
            within release_path do
#               execute :"ln -s #{shared_path}/cache #{release_path}/dstore/"
               execute :"ln -s #{shared_path}/db #{release_path}/dstore/"
               execute :"ln -s #{shared_path}/ctrack/node_modules #{release_path}/ctrack/"
               execute :"ln -s #{shared_path}/dstore/node_modules #{release_path}/dstore/"
               execute :"ln -s #{shared_path}/dportal/node_modules #{release_path}/dportal/"
#               execute :"ln -s #{shared_path}/dportal/js/serv.js #{release_path}/dportal/js/"
            end
        end
    end
end

namespace :deploy do
    after :published, "app_stop:stop"
    after :published, "dportal:create_symlink"
#    after :published, "install_dependency:install"
#    after :published, "app_build:build"
    after :published, "app_restart:start"
end
