lock '3.4.0'

# Application #
#####################################################################################
set :application,     'UN-Transparency-Portal'
set :branch,          ENV["branch"] || "master"
set :user,            ENV["user"] || ENV["USER"] || "dportal"
set :default_env, {"PATH" => "PATH=$PATH:/home/dportal/.nvm/versions/node/v5.7.0/bin"}
set :port,            ENV["port"] || "1337"

# SCM #
#####################################################################################
set :repo_url,        'git@github.com:younginnovations/UN-Transparency-Portal.git'
set :scm,             :git
set :repo_base_url,   :'https://github.com/younginnovations/UN-Transparency-Portal'
#set :repo_diff_path,  :'web-apps/devcheck-new/compare/master...'

# Multistage Deployment #
#####################################################################################
set :stages,              %w(demo stage prod)
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

# Hipchat Integration #
#####################################################################################
set :hipchat_token,         "ZpXA6zeepyBgIm4R3EbImcmm7xCcXMl49NbbEpRg"
set :hipchat_room_name,     "1080583"

# Create ver.txt #
#######################################################################################
require 'date'
set :current_time, DateTime.now

#namespace :environment do

#    desc "Set environment variables"
#   task :set_variables do
#      on roles(:app) do
#           puts ("--> Copying environment configuration file")
#          execute "cp #{release_path}/.env.server #{release_path}/.env"
#         puts ("--> Setting environment variables")
#        execute "sed --in-place -f #{fetch(:overlay_path)}/parameters.sed #{release_path}/.env"
#    end
# end
#end

namespace :hipchat do

    desc 'Notigy Hipchat'
    task :notify do
        on roles(:all) do
            execute "curl -s -H 'Content-Type: application/json' -X POST -d '{\"color\": \"#{fetch(:notify_color)}\", \"message_format\": \"text\", \"message\": \"#{fetch(:notify_message)}\", \"notify\": \"true\" }' https://api.hipchat.com/v2/room/#{fetch(:hipchat_room_name)}/notification?auth_token=#{fetch(:hipchat_token)}"
            Rake::Task["hipchat:notify"].reenable
        end
    end

    desc 'Hipchat notification on deployment'
    task :start do
        on roles(:all) do
            message  = "#{fetch(:user)} is deploying #{fetch(:application)}/#{fetch(:branch)} to #{fetch(:env)}. diff at: #{fetch(:repo_base_url)}#{fetch(:repo_diff_path)}#{fetch(:branch)}"
            set :notify_message, message
            set :notify_color, 'yellow'
            invoke "hipchat:notify"
        end
    end

    task :deployed do
        on roles(:all) do
            message  = "#{fetch(:user)} finished deploying #{fetch(:application)}/#{fetch(:branch)} (revision #{fetch(:current_revision)}) to #{fetch(:env)}."
            set :notify_message, message
            set :notify_color, 'green'
            invoke "hipchat:notify"
        end
    end

    task :notify_deploy_reverted do
        on roles(:all) do
            message  = "Error deploying #{fetch(:application)}/#{fetch(:branch)} (revision #{fetch(:current_revision)}) to #{fetch(:env)}, user: #{fetch(:user)} ."
            set :notify_message, message
            set :notify_color, 'red'
            invoke "hipchat:notify"
        end
    end
end


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
                execute :"./serv-server"
            end
        end
    end
end

namespace :app_restart do
    desc 'start node server'
        task :start do
            on roles(:all) do
            within current_path do
               execute :"nohup /home/dportal/.nvm/versions/node/v5.7.0/bin/node #{current_path}/dportal/js/serv.js --port=#{fetch(:port)} > #{current_path}/serve-log.log 2>&1 &"
            end
        end
    end
end

namespace :deploy do
    after :starting, "hipchat:start"
    after :published, "app_stop:stop"
    after :published, "install_dependency:install"
    after :published, "app_build:build"
    after :published, "app_restart:start"
    after :finished, "hipchat:deployed"
end

if Rake::Task.task_defined? 'deploy:failed'
    after 'deploy:failed', :send_for_help do
       #invoke "hipchat:notify_deploy_reverted"
   end
end
