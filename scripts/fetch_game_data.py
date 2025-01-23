import os
import json
import requests
import hashlib
import subprocess
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
    部署到 GitHub Pages
    """
    try:
        subprocess.run([
            "ghp-import",
            "-n",  # 创建 .nojekyll 文件
            "-m", "Deploy game data to GitHub Pages",  # commit 信息
            "-p",  # 推送到远程
            "-f",  # 强制覆盖
            "./public"  # 要部署的目录
        ], check=True)
        print("Successfully deployed to GitHub Pages")
    except subprocess.CalledProcessError as e:
        print(f"Failed to deploy: {e}")
        raise

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
            else:
                print(f"No changes in: {output_file}")

    # 如果有变化，部署到 GitHub Pages
    if has_changes:
        deploy_to_gh_pages()
    else:
        print("No changes detected, skipping deployment")

if __name__ == "__main__":
    main()
