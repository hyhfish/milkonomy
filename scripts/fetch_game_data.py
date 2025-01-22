import os
import json
import requests

# 数据源 URL
DATA_URL = [
    "https://raw.githubusercontent.com/silent1b/MWIData/main/init_client_info.json",
    "https://raw.githubusercontent.com/holychikenz/MWIApi/main/milkyapi.json",
]


# 输出文件路径
OUTPUT_DIR = "./public/data"
OUTPUT_JSON = [f"{OUTPUT_DIR}/data.json", f"{OUTPUT_DIR}/market.json"]


def fetch_data(url):
    """
    从远程获取 JSON 数据
    :param url: 数据源 URL
    :return: JSON 数据
    """
    response = requests.get(url)
    response.raise_for_status()
    return response.json()


def save_as_json(data, output_file):
    """
    保存数据为 JSON 文件
    :param data: 数据
    :param output_file: 输出文件路径
    """
    os.makedirs(os.path.dirname(output_file), exist_ok=True)  # 确保目录存在
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    # 获取原始数据
    raw_data = [fetch_data(url) for url in DATA_URL]

    # 保存为 JSON
    for data, output_file in zip(raw_data, OUTPUT_JSON):
        save_as_json(data, output_file)

    print("数据处理完成，已保存为 JSON 文件。")


if __name__ == "__main__":
    main()
