import os
from pathlib import Path

# 目的：为了与 AI 交流更方便，
# 将项目中所有代码和文件内容输出到一个地方，集中管理。

def list_and_print_files():
    # 获取当前目录
    current_dir = Path.cwd()
    # 要排除的文件和目录列表 (保持不变)
    exclude_items = [".git", ".idea", "__pycache__",
                     ".gitignore", "venv", ".env",  
                     "gist_venv", "total_json_data",
                     "gg.bat","文件备份", "文件备份2",
                     "my_files.txt", "cat_code.py", "start_repo.py",
                     "过程记录.md", "README.md", "readme.md", 
                     "assets", "gists.json", "gist_app.pyw",
                     "todo.md",
                     "node_modules", # 补充：排除 node_modules，这个目录非常大
                     ".next"       # 补充：排除 .next 编译目录
                     ]
    # 输出文件
    output_file = "my_files.txt"

    # 打开输出文件以写入结果
    with open(output_file, 'w', encoding='utf-8') as out_f:
        # 遍历当前目录
        for root, dirs, files in os.walk(current_dir, topdown=True):
            # 排除指定的目录
            dirs[:] = [d for d in dirs if d not in exclude_items]
            # 排除指定的文件
            files[:] = [f for f in files if f not in exclude_items]

            # --- 文件处理部分 ---
            for name in files:
                file_path = Path(root) / name
                
                # 【核心改动点 #1】
                # 不再计算相对路径，直接使用 file_path (它本身就是完整路径)
                # 原代码: relative_path = file_path.relative_to(current_dir)
                output = f"\n文件: {file_path}\n" # 直接使用完整路径
                
                print(output.strip())
                out_f.write(output)

                # 后续的文件内容读取逻辑保持不变
                if file_path.stat().st_size == 0:
                    output = "内容: 此文件为空\n"
                    print(output.strip())
                    out_f.write(output)
                    continue

                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if content.strip() == "":
                            output = "内容: 此文件为空\n"
                        else:
                            # 确保内容前有一个换行符，格式更清晰
                            output = f"内容:\n{content}\n"
                        print(output.strip())
                        out_f.write(output)
                except UnicodeDecodeError:
                    output = "内容: [无法作为文本读取，可能是二进制文件]\n"
                    print(output.strip())
                    out_f.write(output)
                except PermissionError:
                    output = "内容: [权限被拒绝]\n"
                    print(output.strip())
                    out_f.write(output)
                except Exception as e:
                    output = f"内容: [读取文件出错: {e}]\n"
                    print(output.strip())
                    out_f.write(output)

            # --- 目录处理部分 ---
            for name in dirs:
                dir_path = Path(root) / name
                output = f"\n目录: {dir_path}\n" # 直接使用完整路径
                
                print(output.strip())
                out_f.write(output)
                
                if not any(dir_path.iterdir()):
                    output = "内容: 此目录为空\n"
                else:
                    output = "内容: [这是一个目录]\n"
            

                print(output.strip())
                out_f.write(output)

if __name__ == "__main__":
    list_and_print_files()
    print(f"\n--- 操作完成，所有内容已写入到 my_files.txt ---")


