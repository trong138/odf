Hướng dẫn sử dụng:

# Cách cài đặt

```
sudo npm install -g git+http://git.ows.vn:10180/souzou/ows-dev-flow.git#master
```

# Các câu lệnh hiện tại

### Login

```
odf login
```

Liên kết với các tài khoản của OWS. (Chỉ cần chạy ngay khi cài đặt)
Nhập vào redmine_apikey và gitlab_token. Các thông tin này có thể lấy ở trang dưới đây:
redmine_apikey: http://redmine.ows.vn/my/account
gitlab_token: http://git.ows.vn/profile/personal_access_tokens

### Init project

```
cd project
odf init
```

Init một dự án cụ thể và link sang redmine, chat, gitlab.
redmine_project_identifier: Định danh của một dự án (hỏi PM).
gitlab_project: Tên của dự án trên gitlab (hỏi PM).
project_id: lựa chọn  từ list liệt kê sau khi nhập tên dự án.
chat_channel: link đến channel trên chat.ows.vn (hỏi PM).

### List issues

```
odf me
```
Liệt kê các issue của mình

### Start issue 

```
odf start ISSUE_ID
```

Example:  odf start 5513
Khi đó hệ thống sẽ kiểm tra xem issue này có dành cho bạn không và tự tạo branch đồng thời chuyển sang branch tương ứng.
Ví dụ: feature_5513_add_time_log

### Các câu lệnh của git

```
odf GIT_COMMAND
```

odf cũng được link trực tiếp sang các câu lệnh khác của git như: 

```
odf status
odf log
odf add [files]
...
```

### Commit các file thay đổi

```
odf commit
```

sau đó nhập comment muốn log lên hệ thống.
hoặc commit nhanh với message đính kèm

```
odf commit -m "message here"
```

Ps: bạn sẽ tự động được cộng thời gian làm việc vào issue này trên hệ thôgns redmine.

### Update %Done của issue

```
odf update PERCENT
```

Ps: bạn sẽ tự động được cộng thời gian làm việc vào issue này trên hệ thôgns redmine.

Ví dụ: "odf update 50" để cập nhật issue hiện tại thành 50%

### Pause issue

```
odf pause
```

Ps: bạn sẽ tự động được cộng thời gian làm việc vào issue này trên hệ thôgns redmine.


### Resume issue

```
odf resume
```


### Finish một issue và tạo merge request

```
odf finish
```

Khi đó hệ thống sẽ tự động push lên git, đồng thời đưa các log lên channel chat, redmine

Ps: bạn sẽ tự động được cộng thời gian làm việc vào issue này trên hệ thôgns redmine.

### Chuyển sang 1 issue mới khi đang làm 1 issue khác.

```
odf switch ISSUE_ID
```

Cũng giống như start 1 issue, khi đó bạn sẽ được chuyển sang branch dành cho issue mới này một cách tự động.


# Các bước cần chuẩn bị với PM

- Setting project trên redmine với các custome fields: short-des, Git: checkout from, Git: merge to.
- Tạo channel chat trên chat.ows.vn và tạo hook url
- Khi tạo issue cần khai báo thêm các trường sau (bắt buộc):
    + short-des
    + Git: checkout from
    + Git: merge to.
  và nãy suy nghĩ kỹ càng với các thông tin trên vì nó sẽ ảnh hưởng lớn đến kêt quả của issue.