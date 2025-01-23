import os
import json
import requests
import hashlib
import subprocess
import shutil
from typing import Dict, Any

# 数据源 URL
DATA_URL = [
    "https://raw.githubusercontent.com/silent1b/MWIData/main/init_client_info.json",
    "https://raw.githubusercontent.com/holychikenz/MWIApi/main/milkyapi.json",
]

# 输出文件路径
OUTPUT_DIR = "./public/data"
OUTPUT_JSON = [f"{OUTPUT_DIR}/data.json", f"{OUTPUT_DIR}/market.json"]

def get_file_hash(data: Dict[str, Any]) -> str:
    """
    计算数据的 MD5 哈希值
    """
    json_str = json.dumps(data, sort_keys=True)
    return hashlib.md5(json_str.encode()).hexdigest()

def fetch_data(url: str) -> Dict[str, Any]:
    """
    从远程获取 JSON 数据
    """
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def save_as_json(data: Dict[str, Any], output_file: str) -> None:
    """
    保存数据为 JSON 文件
    """
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_existing_json(file_path: str) -> Dict[str, Any] | None:
    """
    加载现有的 JSON 文件
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def deploy_to_gh_pages() -> None:
    """
    部署到 GitHub Pages，仅更新 public 文件夹
    """
    try:
        # 克隆 gh-pages 分支到临时目录
        subprocess.run([
            "git", "clone",
            "--branch", "gh-pages",
            "--single-branch",
            "--depth", "1",
            "https://github.com/${{ github.repository }}",
            "gh-pages-temp"
        ], check=True)

        # 替换 public 文件夹
        temp_public_dir = "./gh-pages-temp/public"
        if os.path.exists(temp_public_dir):
            shutil.rmtree(temp_public_dir)  # 删除旧的 public 文件夹
        shutil.copytree("./public", temp_public_dir)  # 复制新的 public 文件夹

        # 提交更改
        subprocess.run(["git", "add", "public"], cwd="gh-pages-temp", check=True)
        subprocess.run(["git", "commit", "-m", "Update public folder via GitHub Actions"], cwd="gh-pages-temp", check=True)
        subprocess.run(["git", "push"], cwd="gh-pages-temp", check=True)

        print("Successfully updated public/ on GitHub Pages")
    except subprocess.CalledProcessError as e:
        print(f"Failed to deploy: {e}")
        raise
    finally:
        # 清理临时目录
        if os.path.exists("gh-pages-temp"):
            shutil.rmtree("gh-pages-temp")

def main() -> None:
    has_changes = False

    # 获取并比较每个数据源
    for url, output_file in zip(DATA_URL, OUTPUT_JSON):
        # 获取远程数据
        new_data = fetch_data(url)
        # 获取现有数据
        existing_data = load_existing_json(output_file)

        if existing_data is None:
            # 如果文件不存在，直接保存
            save_as_json(new_data, output_file)
            has_changes = True
            print(f"Created new file: {output_file}")
        else:
            # 比较哈希值
            new_hash = get_file_hash(new_data)
            existing_hash = get_file_hash(existing_data)

            if new_hash != existing_hash:
                # 数据有变化，保存新数据
                save_as_json(new_data, output_file)
                has_changes = True
                print(f"Updated file: {output_file}")

                new_data_json = json.loads(new_data)
                print(f"New Time: {new_data_json['time']}")
                output_file_json = json.loads(output_file)
                print(f"Old Time: {output_file_json['time']}")


            else:
                print(f"No changes in: {output_file}")

    # 如果有变化，部署到 GitHub Pages
    if has_changes:
        deploy_to_gh_pages()
    else:
        print("No changes detected, skipping deployment")

if __name__ == "__main__":
    main()
