import { Playlist, DB, SermonsTabName } from './types';

const markPlaylist: Playlist = {
  title: 'Евангелие от Марка',
  description: 'Эта книга - Евангелие от Марка',
  previewUrl: 'https://slovo-istini.com/image/categories/22/marka_(1).jpg',
  list: [
    {
      title: 'Глава 1',
      list: [
        {
          title: '1. Свидетельства о пришествии Мессии (Часть 1). Марка 1:1-3',
          youtubeUrl: 'https://youtu.be/P5POxTHf6ZA',
          audioUrl:
            'https://slovo-istini.com/image/pages/134/01._svidetelstva_o_prishestvii_messii_(chast_1)._marka_1_1-3.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/134/1._svidetelstva_o_prishestvii_messii__chast_pervaya_(1_1-3).pdf',
          description:
            'В этом отрывке приводятся различные свидетельства о пришествии Христа. Такие свидетельства были и остаются особенно актуальными для евреев, отвергающих Мессию – Иисуса из Назарета.',
        },
        {
          title: '2. Свидетельства о пришествии Мессии (Часть 2). Марка 1:4-8',
          youtubeUrl: 'https://youtu.be/2cxYIstk6nQ',
          audioUrl:
            'https://slovo-istini.com/image/pages/133/02._svidetelstva_o_prishestvii_messii_(chast_2)._marka_1_4-8.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/133/2._svidetelstva_o_prishestvii_messii_chast_vtoraya_(1_4-8).pdf',
          description:
            'В этом отрывке приводятся различные свидетельства о пришествии Христа. Такие свидетельства были и остаются особенно актуальными для евреев, отвергающих Мессию – Иисуса из Назарета.',
        },
        {
          title: '3. Подготовка к великому служению. Марка 1:9-15',
          youtubeUrl: 'https://youtu.be/hlNXrYyi7VM',
          audioUrl:
            'https://slovo-istini.com/image/pages/132/03._podgotovka_k_velikomu_slujeniyu._marka_1_9-15.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/132/3._podgotovka_k_velikomu_slujeniyu_(1_9-15).pdf',
          description:
            'Великое служение Христа началось с великой подготовки. Господь продемонстрировал великое послушание, крестившись от Иоанна, Он получил великие полномочия от Отца и Духа, выдержал великое испытание в пустыне и выступил с великой проповедью. Если вы хотите уподобляться Христу в служении, служите, проявляя послушание, служите в соответствии со своими дарами, преодолевайте испытания, через которые Господь закаляет вас, словом и делом утверждайте великие библейские истины. Хотели бы вы уподобиться Христу в служении? Данная проповедь поможет вам в этом.',
        },
        {
          title: '4. Призыв к благовестию. Марка 1:16-20',
          youtubeUrl: 'https://youtu.be/XT3fsf1EDNs',
          audioUrl:
            'https://slovo-istini.com/image/pages/131/04._prizyv_k_blagovestiyu._marka_1_16-20.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/131/4._prizyv_k_blagovestiyu_(1_16-20).pdf',
          description:
            '«О, вы, напоминающие о Господе! не умолкайте» (Ис. 62:6). Наша задача – быть посвященным провозглашению Евангелия. Ради благовестия ученики оставили родной дом, родственников, друзей и знакомых, свою профессию. Будьте больше всего посвящены не спорту, не отдыху, не своей профессиональной деятельности, а делу Божьему. Благовестие – великая ценность, требующая великой посвященности.',
        },
        {
          title: '5. Противостояние темным силам. Марка 1:21-28',
          youtubeUrl: 'https://youtu.be/38__FQuCPOo',
          audioUrl:
            'https://slovo-istini.com/image/pages/130/protivostoyanie_temnym_silam._marka_1_21-28.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/130/protivostoyanie_temnym_silam._marka_1_21-28.pdf',
          description:
            'Иисус Христос, одержав победу над сатаной в пустыне, демонстрирует Свою власть над его подданными – бесами. Вопрос противостояния темным силам всегда был актуален для церкви. Знаете ли вы, как избежать ошибок и крайностей в понимании этого вопроса? Что является эффективным средством в противостоянии темным силам? Имеют ли христиане власть над бесами? Как правильно реагировать при столкновении с темными силами? Ответы на эти вопросы вы найдете в проповеди!',
        },
        {
          title: '6. Власть над болезнями. Марка 1:29-31',
          youtubeUrl: 'https://youtu.be/aaT00nXcnRk',
          audioUrl:
            'https://slovo-istini.com/image/pages/129/vlast_nad_boleznyami._marka_1_29-31.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/129/vlast_nad_boleznyami._marka_1_29-31.pdf',
          description:
            'С момента грехопадения человечество страдает от болезней. Иисус Христос есть тот, кто способен отменить последствия грехопадения, простить личные грехи и сковать темные силы, распространяющие болезни. Его власть над болезнями доказывает, что наш Господь – Мессия и Бог.',
        },
        {
          title: '7. Как поступать при возрастающей популярности служения. Марка 1:32-39',
          youtubeUrl: 'https://youtu.be/-ONSmsNLeHY',
          audioUrl:
            'https://slovo-istini.com/image/pages/128/kak_postupat_pri_vozrastayushchey_populyarnosti_slujeniya._marka_1_32-39.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/128/kak_postupat_pri_vozrastayushchey_populyarnosti_slujeniya._marka_1_32-39.pdf',
          description:
            'Испытания известностью, популярностью и успехом могут стать для человека самыми трудными, даже более сложными, чем испытания, связанные со страданиями и борьбой. Когда Господь благословляет служение церкви и ее членов, может возникнуть искушение, связанное с ленью, нежеланием напряженно трудиться, или искушение, связанное со стремлением к популярности любой ценой и т. д. Избежать подобных ошибок мы сможем, наблюдая за тем, как Иисус вел Себя в момент особых благословений, в момент резко возросшей популярности.',
        },
        {
          title: '8. Особое милосердие Господа. Марка 1:40-45',
          youtubeUrl: 'https://youtu.be/FsBGfcgGFSY?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/127/osoboe_miloserdie_gospoda._marka_1_40-45.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/127/osoboe_miloserdie_gospoda._marka_1_40-45.pdf',
          description:
            'Встречая страдающих, потерянных в мире греха людей, Иисус наполнялся жалостью к ним, был проникнут глубоким состраданием, потому что милосердие является неотъемлемой частью Его природы. Изучая, как Господь Иисус Христос явил Свое особое милосердие прокаженному, мы сможем получить ответы на следующие вопросы: кому Господь являет Свое особое милосердие? Что важнее: явление особого милосердия Господа или проповедь? Кого явление особого Божьего милосердия осуждает? И как к явлению особого Божьего милосердия нельзя относиться?',
        },
      ],
    },
    {
      title: 'Глава 2',
      list: [
        {
          title: '9. Власть прощать грехи. Марка 2:1-12',
          youtubeUrl: 'https://youtu.be/URxndCTsTsc?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/126/vlast_proshchat_grehi._marka_2_1-12.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/126/vlast_proshchat_grehi._marka_2_1-12.pdf',
          description:
            'Прощение грехов – самая большая нужда человека. Исследуя первое свидетельство Марка о власти Христа над грехом, давайте проследим, как Господь проявил эту власть перед своими противниками, и как Он подтвердил Свое право прощать грехи.',
        },
        {
          title: '10. Отношение к грешникам. Марка 2:13-17',
          youtubeUrl: 'https://youtu.be/jcFnaH4a6J0?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/125/otnoshenie_k_greshnikam._marka_2_13-17.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/125/otnoshenie_k_greshnikam._marka_2_13-17.pdf',
          description:
            '«Приближались к Нему все мытари и грешники слушать Его. Фарисеи же и книжники роптали, говоря: Он принимает грешников и ест с ними» (Лк. 15:1-2). Несмотря на все предупреждения Писания, негативное отношение к грешникам не миновало тех, кто относит себя к последователям Господа. Как этому противостоять? Как этого не допускать? Именно Слово Божие является лучшим средством для решения любых духовных проблем и защиты от любых заблуждений. Если мы хотим проверить свое отношение к грешникам, если мы хотим учиться правильному отношению к ним, лучшее, что мы можем сделать – это, обратившись к Слову, учиться на правильном отношении Христа к грешникам и неправильном отношении книжников и фарисеев.',
        },
        {
          title: '11. Евангелие благодати и законнические традиции. Марка 2:18-22',
          youtubeUrl: 'https://youtu.be/mGsmY28ttWg?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/124/evangelie_blagodati_i_zakonnicheskie_tradicii._marka_2_18-22.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/124/evangelie_blagodati_i_zakonnicheskie_tradicii._marka_2_18-22.pdf',
          description:
            'В этом отрывке противостояние Христу связано с более глубоким вопросом, чем вопрос соблюдения регулярных постов. Оно связано с отношением Христа ко всем законническим традициям вообще. Перед нами две совершенно противоположные позиции: Евангелие благодати и законнические традиции. Для того чтобы каждый из нас твердо стоял на стороне Евангелия благодати, необходимо знать, что эти две противоположные позиции не могут мирно сосуществовать и не могут быть объединены.',
        },
        {
          title: '12. Законничество и Писание. Марка 2:23-28',
          youtubeUrl: 'https://youtu.be/ZJU_0Uw2ThE?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/123/zakonichestvo_i_pisanie._marka_2_23-28.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/123/zakonnichestvo_i_pisanie._marka_2_23-28.pdf',
          description:
            'Законничество можно сравнить с радиацией: она незаметна для человека, но очень опасна, ее уровень можно определить только при помощи специальных приборов. Однако радиация губит только тело, а законничество – душу. Изучение данной проповеди предоставляет нам возможность отметить основные отличия законнического подхода к Писанию и научиться выявлять законничество, чтобы не стать его жертвой.',
        },
      ],
    },
    {
      title: 'Глава 3',
      list: [
        {
          title: '13. Греховность законнической религии. Марка 3:1-6',
          youtubeUrl: 'https://youtu.be/h0FjODnwiN8?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/122/13._grehovnost_zakonnicheskoy_religii._marka_3_1-6.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/122/13._grehovnost_zakonnicheskoy_religii._marka_3_1-6.pdf',
          description:
            'Как очень хорошо видно на примере столкновения Христа и фарисеев, сторонники законнической религии выглядят праведными людьми лишь до тех пор, пока они не столкнулись со сторонниками Евангелия благодати. Как мы увидим сегодня в изучаемом отрывке, истина открывает коварство, иррациональность, жестокость и компромиссность законнической религии.',
        },
        {
          title: '14. Важные принципы служения. Марка 3:7-12',
          youtubeUrl: 'https://youtu.be/bc9FBiX_rXY?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/121/14._vajnye_principy_slujeniya._marka_3_7-12.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/121/14._vajnye_principy_slujeniya._marka_3_7-12.pdf',
          description:
            'Оставаться долгое время эффективным в служении, достойно участвовать в созидании церкви – трудная задача! Ее сложность подтверждается многими неудачами, постигающими служителей, которые можно наблюдать в самых разных церквах. Наблюдая за жизнью и служением нашего Господа, мы разберем три важные принципа, которые сделают наше служение более эффективным.',
        },
        {
          title: '15. Условия формирования христианского лидера (Часть 1). Марка 3:13-16',
          youtubeUrl: 'https://youtu.be/wjccn8hnaXY?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/120/15._usloviya_formirovaniya_hristianskogo_lidera_(chast_1)._marka_3_13-16.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/120/15._usloviya_formirovaniya_hristianskogo_lidera_(chast_1)._marka_3_13-16.pdf',
          description:
            'Взращивание лидеров являлось важной задачей в служении нашего Господа и остается важнейшей задачей церкви, ее руководства и по сей день. В этой проповеди будут рассмотрены четыре условия, соблюдение которых обязательно для формирования христианского лидера.',
        },
        {
          title: '16. Условия формирования христианского лидера (Часть 2). Марка 3:17-19',
          youtubeUrl: 'https://youtu.be/19MbUE4tCRI?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/119/16._usloviya_formirovaniya_hristianskogo_lidera_(chast_2)._marka_3_13-19.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/119/16._usloviya_formirovaniya_hristianskogo_lidera_(chast_2)._marka_3_17-19.pdf',
          description:
            'Взращивание лидеров являлось важной задачей в служении нашего Господа и остается важнейшей задачей церкви, ее руководства и по сей день. В этой проповеди будут рассмотрены четыре условия, соблюдение которых обязательно для формирования христианского лидера.',
        },
        {
          title: '17. Дискредитирующие обвинения (Часть 1). Марка 3:20-21',
          youtubeUrl: 'https://youtu.be/DA6XnBHJ4hY?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/231/17._diskreditiruyushchie_obvineniya_(chast_1)._marka_3_20-21.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/231/17._diskreditiruyushchie_obvineniya_(chast_1)_marka_3_20-21.pdf',
          description:
            'Самая эффективная и достаточно распространенная тактика противников истины состоит в дискредитации человека Божьего, подрыва доверия к проповеднику истины при помощи ложных обвинений. Люди должны были разочароваться в новом Учителе. С этой целью по репутации Иисуса из Назарета наносится тяжелый удар! Особая сила удара была связана с тремя обвинениями. Какими и как на них реагировать, вы узнаете, прослушав проповедь.',
        },
        {
          title: '18. Дискредитирующие обвинения (Часть 2). Марка 3:22-30',
          youtubeUrl: 'https://youtu.be/Yqo-tVmOvUw?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/232/18._diskreditiruyushchie_obvineniya_(chast_2)._marka_3_22-30.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/232/18._diskreditiruyushchie_obvineniya_(chast_2)._marka_3_22-30.pdf',
          description:
            'Истина, утверждаемая Сыном Божьим, разрушала царство сатаны. Вот почему враг душ человеческих так усердно стремился оклеветать нашего Господа. Рассматривая обвинения, выдвигаемые против Иисуса, мы можем многому научиться. Вероятно, такие же обвинения могут выдвигаться и против служителей, утверждающих истину в наши дни, и против каждого верного христианина. В этой проповеди мы узнаем, как вести себя в подобных обстоятельствах.',
        },
        {
          title: '19. Дискредитирующие обвинения (Часть 3). Марка 3:31-35',
          youtubeUrl: 'https://youtu.be/WwzcWb9AjzA?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/233/19._diskreditiruyushchie_obvineniya_(chast_3)._marka_3_31-35.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/233/19._diskreditiruyushchie_obvineniya_(chast_3)._marka_3_31-35.pdf',
          description:
            'Пятая заповедь Моисеева закона требовала почитать родителей. В связи с этим от Иисуса ожидалось следующее: как только Он услышал о приближении матери и братьев, Он должен был немедленно прекратить проповедь и выйти к ним навстречу. В противном случае Иисуса могли обвинить в нарушение закона (отказ почитать родителей). На пример Христа мы разберем что важнее: кровное или духовное родство.',
        },
      ],
    },
    {
      title: 'Глава 4',
      list: [
        {
          title: '20. Основания перспективности проповеди Слова. Марка 4:1-8',
          youtubeUrl: 'https://youtu.be/ZhX_WAwGht0?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/234/20._osnovaniya_perspektivnosti_propovedi_slova._marka_4_1-8.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/234/20._osnovaniya_perspektivnosti_propovedi_slova._marka_4_1-8.pdf',
          description:
            'Сегодня услышать проповеди можно во многих церквах. Но услышать проповедь, разъясняющую значение Писания, – редкость. Потеря интереса к проповеди вообще и к библейской проповеди в частности, несомненно, смущает евангельские церкви, побуждает христиан задуматься над вопросами: какова роль разъяснения Слова в личном свидетельстве; какова роль разъяснения Слова в деле созидания церкви; какова перспектива у проповеди Слова? Вы получите ответы на эти вопросы, прослушав данную проповедь.',
        },
        {
          title: '21. Условия ясного понимания Слова Божьего. Марка 4:9-13',
          youtubeUrl: 'https://youtu.be/fhTK1jCfGwQ?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/235/21._usloviya_yasnogo_ponimaniya_slova_bojego._marka_4_9-13.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/235/21.usloviya_yasnogo_ponimaniya_slova_bojego._marka_4_9-13.pdf',
          description:
            'Вопрос ясного понимания Слова Божьего – это основной вопрос нашей жизни. Без понимания Слова (Евангелия) спасение невозможно, равно как и рост в практическом освящении. Исследуемый сегодня отрывок поможет нам понять, что необходимо делать, чтобы ясно понимать Писание.',
        },
        {
          title: '22. Четыре вида реакции на проповедь Слова. Марка 4:14-20',
          youtubeUrl: 'https://youtu.be/VhiYGevl-nQ?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/236/22._chetyre_vida_reakcii_na_propoved_slova._marka_4_14-20.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/236/22._chetyre_vida_reakcii_na_propoved_slova._marka_4_14-20.pdf',
          description:
            'Каждый истинно верующий христианин должен распространять Слово Божье. И его труд можно сравнить с земледелием, которое может приносить плоды, а может вообще не приносить. Поэтому нам необходимо быть готовыми встретиться с отвергающими Слово людьми. И продолжать свидетельствовать о Христе с уверенностью: если Слово коснется восприимчивого слушателя, то оно принесет добрый плод.',
        },
        {
          title: '23. Ответственность обладающего Словом. Марка 4:21-25',
          youtubeUrl: 'https://youtu.be/i398Uw2CvhU?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/238/23._otvetstvennost_obladayushchego_slovom._marka_4_21-25.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/238/23._otvetstvennost_obladayushchego_slovom._marka_4_21-25.pdf',
          description:
            'Возможность слышать Слово и понимать Его – это не только великая честь, великая привилегия, но и великая ответственность. Мы ответственны за то, чтобы возвещать Слово всем и применять его в своей жизни. Помним ли мы сегодня о своей ответственности? Знаем ли мы, в чем она состоит? Для ответа на эти вопросы обратимся к исследуемой проповеди.',
        },
        {
          title: '24. Усилия и плоды проповедника Слова. Марка 4:26-29',
          youtubeUrl: 'https://youtu.be/Z2j2-QatwIk?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/239/24._usiliya_i_plody_propoveduyushchego_slovo._marka_4_26-29.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/239/24._usiliya_i_plody_propovednika_slova._marka_4_26-29.pdf',
          description:
            'В каком направлении христианский служитель должен прилагать максимум усилий? Можно ли сказать, что, ожидая увидеть добрые плоды своего труда, христианский служитель должен максимум усилий вкладывать в провозглашение Слова? Или же для него возможно, не оставляя проповедь, больше всего сил отдавать какой-то другой деятельности? Для того чтобы ответить на эти вопросы, обратимся к данной проповеди.',
        },
        {
          title: '25. Масштабы влияния Слова. Марка 4:30-32',
          youtubeUrl: 'https://youtu.be/JbvW_Fcs05M?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/240/25._masshtaby_vliyaniya_slova._marka_4_30-32.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/240/25._masshtaby_vliyaniya_slova._marka_4_30-32.pdf',
          description:
            'Евангелие непопулярно в этом мире. Ученики Христа могли поддаться искушению разочарования, связанного с осознанием ничтожности дела, ради которого они оставили все. Желая ободрить учеников, Иисус рассказывает притчу о горчичном зерне. Данная притча учит, что проповедь Евангелия Царства только кажется ничтожным предприятием, впоследствии она распространится на весь мир и изменит ход человеческой истории.',
        },
        {
          title: '26. Мудрый подход к провозглашению Слова. Марка 4:33-34',
          youtubeUrl: 'https://youtu.be/gTJd3AU9OBM?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/241/26._mudryy_podhod_k_provozglasheniyu_slova._marka_4_33-34.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/241/26._mudryy_podhod_k_provozglasheniyu_slova._marka_4_33-34.pdf',
          description:
            'Очевидно, что Иисус рассказал больше притч, чем записал Марк. Но записанных Марком притч достаточно, чтобы понять, как учил Спаситель. Излагая Свое учение в притчах, Господь в некоторой степени ограничивал, сдерживал Себя. Он проповедовал, «сколько они могли слышать».\nНасколько ваш подход отличается мудростью?\nДанная тема актуальна не только для проповедников, но и для всех христиан, разъясняющих Писание своим детям, родственникам или знакомым.',
        },
        {
          title: '27. В испытаниях со Христом. Марка 4:35-41',
          youtubeUrl: 'https://youtu.be/ZCgkrWr8n5w?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/242/27._v_ispytaniyah_so_hristom._marka_4_35-41.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/242/27._v_ispytaniyah_so_hristom._marka_4_35-41.pdf',
          description:
            'Несмотря на то, что ученики уже многое знали о своем Учителе, видели Его многочисленные чудеса, тем не менее, оказавшись в экстремальной ситуации, посреди бушующего Галилейского озера, они боялись и паниковали так, словно остались один на один со своим испытанием. Не совершаем ли и мы подобных ошибок? В чем опасность подобной реакции? Как научиться правильно реагировать, преодолевая испытания в присутствии Господа? В поисках ответа на эти вопросы обратимся к проповеди.',
        },
      ],
    },
    {
      title: 'Глава 5',
      list: [
        {
          title: '28. Опасность бесов. Марка 5:1-5',
          youtubeUrl: 'https://youtu.be/xQNabNR4rTg?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl: 'https://slovo-istini.com/image/pages/243/28._opasnost_besov._marka_5_1-5.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/243/28._opasnost_besov._marka_5_1-5.pdf',
          description:
            'Изучая Евангелие от Марка, мы можем увидеть как много актуальных тем раскрывает Иисус в Своем служении и обучении учеников. Одной из таких тем является тема об опасности темных сил. Кто такие бесы, какова их сила, опасны ли они, кто может защитить нас от них? Кто способен покорить эту злую силу? За ответами на данные вопросы обратимся к Слову.',
        },
        {
          title: '29. Покорение бесов. Марка 5:6-13',
          youtubeUrl: 'https://youtu.be/50KeiYTxmHU?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/244/29._pokorenie_besov._marka_5_6-13.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/244/29._pokorenie_besov._marka_5_6-13.pdf',
          description:
            'Опасность, исходящую от бесов бесов трудно переоценить. Они стремятся распространить свое влияние на определенных территориях и контролировать человека.\nКто же способен покорить бесовские силы? Есть ли у человечества надежда избавиться от их пагубного влияния? Если все во Вселенной и бесовские силы находятся под контролем Бога, тогда почему Бог позволяет Своим противникам действовать? Как Бог, позволяющий темным силам делать зло, может при этом оставаться святым и непричастным к злу? Ответы на эти вопросы мы получим в данной проповеди.',
        },
        {
          title: '30. Реакция на покорение бесов. Марка 5:14-20',
          youtubeUrl: 'https://youtu.be/9hADvEBLoY4?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/245/30._reakciya_na_pokorenie_besov._marka_5_14-20.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/245/30._reakciya_na_pokorenie_besov._marka_5_14-20.pdf',
          description:
            'Осознавая огромную опасность, исходящую со стороны бесовских сил, мы можем радоваться тому, что наш Пастырь Иисус Христос способен покорить эту злую силу. Однако не все люди, сталкивающиеся с проявлением власти Христа над темными силами, реагируют таким образом. О двух противоположных реакциях на покорение бесов властью Христа мы поговорим в этой проповеди.',
        },
        {
          title: '31. Сила истинной веры. Марка 5:21-43',
          youtubeUrl: 'https://youtu.be/IFdlJv41fpg?list=PLVPfSXBMIZz5j9LDXeq6YE44lkkXLJsn6',
          audioUrl:
            'https://slovo-istini.com/image/pages/246/31._sila_istinnoy_very._marka_5_21-43.mp3',
          textFileUrl:
            'https://slovo-istini.com/image/pages/246/sila_istinnoy_very._marka_5_21-43.pdf',
          description:
            'Как известно из Писания, не всякая вера является истинной, спасающей. Истинная вера отличается силой, твердостью, бескомпромиссностью. У ложной веры нет силы преодолевать испытания и трудности. Является ли ваша вера истинной? Отличается ли она силой, твердостью и бескомпромиссностью? Независимо от времени нахождения в видимой церкви проверять подлинность своей веры всегда полезно. Сегодня мы сможем осуществить одну из таких проверок.',
        },
      ],
    },
  ],
};

const lukePlaylist: Playlist = {
  title: 'Евангелие от Луки',
  previewUrl:
    'https://slovo-istini.com/image/categories/78/whatsapp_image_2022-02-15_at_11.20.06.jpeg',
  list: [],
};

const johnPlaylist: Playlist = {
  title: 'Евангелие от Иоанна',
  previewUrl: 'https://slovo-istini.com/image/categories/21/ioanna_(1).jpg',
  list: [],
};
const actsPlaylist: Playlist = {
  title: 'Деяния Апостолов',
  previewUrl:
    'https://slovo-istini.com/image/categories/19/whatsapp_image_2022-11-11_at_17.09.37_(2).jpeg',
  list: [],
};
const jacobPlaylist: Playlist = {
  title: 'Послание Иакова',
  previewUrl:
    'https://slovo-istini.com/image/categories/23/whatsapp_image_2022-11-11_at_17.11.51.jpeg',
  list: [],
};
const firstPetePlaylist: Playlist = {
  title: 'Первое послание Петра',
  previewUrl:
    'https://slovo-istini.com/image/categories/13/whatsapp_image_2022-11-11_at_17.11.51_(2).jpeg',
  list: [],
};
const secondPetePlaylist: Playlist = {
  title: 'Второе послание Петра',
  previewUrl:
    'https://slovo-istini.com/image/categories/12/whatsapp_image_2022-11-11_at_17.11.51_(1).jpeg',
  list: [],
};
const firstCorinthiansPlaylist: Playlist = {
  title: 'Первое послание к коринфянам',
  previewUrl: 'https://slovo-istini.com/image/categories/65/1_korin_(1).jpg',
  list: [],
};
const secondCorinthiansPlaylist: Playlist = {
  title: 'Второе послание к коринфянам',
  previewUrl: 'https://slovo-istini.com/image/categories/67/2_korinfyanam.jpg',
  list: [],
};
const ephesiansPlaylist: Playlist = {
  title: 'Послание к ефесянам',
  previewUrl:
    'https://slovo-istini.com/image/categories/20/whatsapp_image_2022-11-11_at_17.09.38.jpeg',
  list: [],
};
const philippiansPlaylist: Playlist = {
  title: 'Послание к филиппийцам',
  previewUrl:
    'https://slovo-istini.com/image/categories/14/whatsapp_image_2022-11-11_at_17.09.37.jpeg',
  list: [],
};
const firstAndSecondThessaloniansPlaylist: Playlist = {
  title: 'Первое и второе послание к фессалоникийцам',
  previewUrl:
    'https://slovo-istini.com/image/categories/17/whatsapp_image_2022-11-11_at_17.11.52.jpeg',
  list: [],
};
const titusPlaylist: Playlist = {
  title: 'Послание к Титу',
  previewUrl:
    'https://slovo-istini.com/image/categories/15/whatsapp_image_2022-11-02_at_21.01.38.jpeg',
  list: [],
};
const philemonPlaylist: Playlist = {
  title: 'Послание к Филимону',
  previewUrl: 'https://slovo-istini.com/image/categories/68/filimonu.png',
  list: [],
};
const revelationPlaylist: Playlist = {
  title: 'Откровение',
  previewUrl: 'https://slovo-istini.com/image/categories/66/otkrovenie_.jpg',
  list: [],
};

export const db: DB = {
  sermons: [
    {
      tabName: SermonsTabName.OnBible,
      playlists: [
        markPlaylist,
        lukePlaylist,
        johnPlaylist,
        actsPlaylist,
        jacobPlaylist,
        firstPetePlaylist,
        secondPetePlaylist,
        firstCorinthiansPlaylist,
        secondCorinthiansPlaylist,
        ephesiansPlaylist,
        philippiansPlaylist,
        firstAndSecondThessaloniansPlaylist,
        titusPlaylist,
        philemonPlaylist,
        revelationPlaylist,
      ],
    },
    {
      tabName: SermonsTabName.Topical,
      playlists: [],
    },
  ],
};
