# Slack бот для проведения randomcoffee
- бот работает в каналах, в которых он добавлен и настроен (задано расписание, часовой пояс...)
- следит за вновь добавившимися пользователями - знакомит их с правилами
- сделит за покидающими канал и "догоняет" их формой обратной связи
- просмотр истории "кофе-встреч" для участников
- пользователи могут вставать на паузу (отпуск, болезнь, загрузка по работе...)
- бот учитывает историю встреч (участники не соберутся в пару, если в течении полу года "пили кофе")
- режим автоподверждения для участников всегда готовых к новым встречам
- функция "моя история" для участников, которые хотят представиться собеседнику
- (админ) ручной запуск алгоритма
- (админ) просмотр участников на паузе
- (админ) установка расписания
- (админ) импорт истории (если пользовались другим простым ботом для проведения randomcoffee)
- (админ) просмотр списка админов
- (админ) добавление/удаление админов

# Алгоритм работы
Алгоритм работы разделяется на 3 фазы

- запуск раунда
- поиск совпадений (матчинг)
- закрытие раунда

и происходит для каждого канала в соответствии с расписанием

### Запуск (разово в начале недели)
- берем участников канала
- исключаем тех, кто на паузе, ботов, участников с ограничениями (slack restricted, slack deleted)
- создаем "событие" (раунд)
- очищаем список готовых участников для канала
- публикуем стартовое сообщение в общий канал
- добавляем в список готовых участников - участников с автоподтверждением
- спрашиваем участников готовы ли они участвовать в текущем раунде
- в случае согласия - добавляем их в список готовых участников
- в случае отмены - желаем им всего лучшего и форсим участвовать в будущем

### Матчинг (регулярно, каждые 30 мин в рабочее время)
- если раунд закрыт - завершаем работу матчинга
- берем список готовых участников
- матчим их с учетом истории
- удаляем из списка готовых участников
- обновляем сообщение в основном канале - добавляем пары
- рассылаем пользователям сообщения о собранных парах

### Закрытие (разово, в конце недели)
- отмечаем раунд закрытым
- обновляем сообщение в канале (делаем приписку, что раунд завершен)
- берем пользователей из списка готовых участников и отсылаем им сообщение что в этот раз им не нашлось пары, форсим их реагировать быстрее на сообщения бота

# Используемые технологии
- JavaScript
- Slack API
  * требует доменое имя (на него Slack будет слать запросы)
  * требует сертификат, общение по HTTPS
- MySQL

# Используемые слак методы 

Слак постоянно меняет поведение своих методов, улучшает процессы взаимодействия с ботами, в боте задействованы следующие методы и механизмы взаимодействия со слаком:

- [chat.postMessage](https://api.slack.com/methods/chat.postMessage)
- [chat.update](https://api.slack.com/methods/chat.update)
- [chat.postEphemeral](https://api.slack.com/methods/chat.postEphemeral)
- [dialog.open](https://api.slack.com/methods/dialog.open)
- [conversations.info](https://api.slack.com/methods/conversations.info)
- [conversations.members](https://api.slack.com/methods/conversations.members)
- [users.list](https://api.slack.com/methods/users.list)
- [users.info](https://api.slack.com/methods/users.info)
- [users.conversations](https://api.slack.com/methods/users.conversations)
- [асинхронные ответы](https://api.slack.com/interactivity/handling#async_responses)

## @TODO
- как конфигурировать
- как запускать
- докинуть k8s конфиги
- конфигурация ссылок в сообщениях бота
- специфичные смайлы в сообщениях требуют пересмотра