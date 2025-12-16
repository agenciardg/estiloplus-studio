// GitHub integration for pushing code to repository
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.replit',
  'replit.nix',
  '.config',
  'dist',
  '.cache',
  '.upm',
  'attached_assets',
  'generated-icon.png',
  '.breakpoints',
  '.local',
  'tmp',
  '/tmp',
  'scripts/push-to-github.ts'
];

function shouldIgnore(filePath: string): boolean {
  return IGNORED_PATHS.some(ignored => filePath.includes(ignored));
}

function getAllFiles(dirPath: string, basePath: string = ''): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = basePath ? `${basePath}/${item}` : item;
      
      if (shouldIgnore(relativePath)) continue;
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath, relativePath));
      } else if (stat.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          files.push({ path: relativePath, content });
        } catch (e) {
          console.log(`Skipping binary file: ${relativePath}`);
        }
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dirPath}:`, e);
  }
  
  return files;
}

export async function pushToGitHub(repoName: string): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    const owner = user.login;
    
    console.log(`Creating repository: ${repoName} for user: ${owner}`);
    
    let repo;
    try {
      const { data: existingRepo } = await octokit.repos.get({
        owner,
        repo: repoName
      });
      repo = existingRepo;
      console.log(`Repository ${repoName} already exists, will update it`);
    } catch (e: any) {
      if (e.status === 404) {
        const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: 'EstiloPlus Studio - Virtual Try-On Application for Plus Size Fashion',
          private: false,
          auto_init: true
        });
        repo = newRepo;
        console.log(`Repository ${repoName} created successfully with README`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        throw e;
      }
    }
    
    const projectPath = process.cwd();
    const files = getAllFiles(projectPath);
    
    console.log(`Found ${files.length} files to upload`);
    
    let uploadedCount = 0;
    
    for (const file of files) {
      try {
        let existingSha: string | undefined;
        try {
          const { data: existingFile } = await octokit.repos.getContent({
            owner,
            repo: repoName,
            path: file.path
          });
          if (!Array.isArray(existingFile) && existingFile.type === 'file') {
            existingSha = existingFile.sha;
          }
        } catch (e) {
        }
        
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo: repoName,
          path: file.path,
          message: `Add/Update ${file.path}`,
          content: Buffer.from(file.content).toString('base64'),
          sha: existingSha
        });
        
        uploadedCount++;
        console.log(`[${uploadedCount}/${files.length}] Uploaded: ${file.path}`);
      } catch (error: any) {
        console.error(`Failed to upload ${file.path}: ${error.message}`);
      }
    }
    
    console.log(`Successfully pushed ${uploadedCount} files to GitHub!`);
    
    return {
      success: true,
      repoUrl: repo.html_url
    };
  } catch (error: any) {
    console.error('GitHub push error:', error);
    return {
      success: false,
      error: error.message || 'Failed to push to GitHub'
    };
  }
}
