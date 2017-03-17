/*
 * passer à :
*/
function abmanimation(opt) {
  var width = 900,
      height = 250;

  var productivite = 100,
      demande_unitaire = 90,
      max_pack_conso = 10,
      salaire_unique = 1000;

  var entreprises;
  var menages;
  var tour;
  var frame;

  if (typeof(opt) == "undefined") {
    opt = {
      div: "body",  avecbiens: true, avecmonnaie: true, detaillerzero: true , rebouclertourzero: false,  nbmaxtours: 10
    }
  }
  if (typeof(opt.avecbiens) == "undefined") {opt.avecbiens = true;}
  if (typeof(opt.avecmonnaie) == "undefined") {opt.avecmonnaie = true;}
  if (typeof(opt.detaillerzero) == "undefined") {opt.detaillerzero = true;}
  if (typeof(opt.rebouclertourzero) == "undefined") {opt.rebouclertourzero = false;}
  if (typeof(opt.nbmaxtours) == "undefined") {opt.nbmaxtours = 10;}

  /* nb aleatoire entre 0 et n - 1  (uniforme ??) */
  function alea(n) {
    if (n > 0) {
      return Math.floor(Math.random() * n);
    }
    return 0;
  }

  /* retourne un nb aleatoire entre -n et n selon loi "normale" */
  function aleanorm(n) {
    var somme = 0;
    var resolution = 5;
    for (var i = 0; i < resolution; i += 1) {
      somme += alea(n + 1);
      somme += n - alea(n + 1);
    }
    return Math.floor(somme / (2*resolution));
  }

  var idm;
  function nextm() {
    idm += 1;
    return {"i": idm, "id": idm, "ido": idm,
            "employeur": null, "date": 0,
            "solde": 0,
            "dem": 90, "conso": []};
  }

  var ide;
  function nexte() {
    ide += 1;
    return {"i": ide, "id": "e"+ide,
            "sal": 0,
            "stock": 0,
            "stocko": 0,
            "obj": 1 + alea(3),
            "pu": 5 + alea(10),
            "solde": 0,
            "color": "rgb("+alea(200)+","+alea(200)+","+alea(200)+")"
           };
  }

  function initialisationdonnees () {
    /* des entreprises au hasard */
    ide = -1;
    entreprises = d3.range(3).map(nexte);
    /* enfin pas tout à fait (pour la didactique) */
    entreprises[0].couleur = "#CC00CC";
    entreprises[1].couleur = "#00CCCC";
    entreprises[2].couleur = "#CCCC00";
    entreprises[0].obj = 0;
    entreprises[1].obj = 0;
    entreprises[2].obj = 0;

    /* des menages tous identiques */
    idm = -1;
    menages = d3.range(12).map(nextm);

    /* tourodatage */
    tour = 0;
    frame = 0;
  }

  function getter(champ) {
    return function (d) {
      return d[champ];
    };
  }

  var getid = getter("id");
  var geti = getter("i");
  var getcolor = getter("couleur");
  function getmecolor(d) {
    if (d.employeur != null) {
      for (var i = 0, n = entreprises.length; i < n; i += 1) {
        if (d.employeur == entreprises[i].i) {
          return entreprises[i].couleur;
        }
      }
    }
    return "none";
  }
  var getsal = getter("sal");
  var getobj = getter("obj");
  var getstock = getter("stock");
  var getsat = getter("sat");
  var getpu = getter("pu");
  var getsolde = getter("solde");


  /* manipuler les données */
  function max (a, b) { if (a < b) return b; else return a;}
  function min (a, b) { if (a > b) return b; else return a;}
  function melanger(t) {
    var tmp;
    /*
     ido: se souvenir de la place actuelle des données
     */
    for (var i = 0, n = t.length; i < n; i += 1) {
        t[i].ido = t[i].id;
    }
    for (var n = t.length; n > 1; n -= 1) {
      var i = alea(n);
      var j = n - 1;
      /* pour d3js on garde l'id à sa place  */
      if (typeof(t[j]) != "undefined") {
        tmp = t[j].id;
        t[j].id = t[i].id;
        t[i].id = tmp;
      }
      /* echange complet (l'id revient donc à son indice initial) */
      tmp = t[j];
      t[j] = t[i];
      t[i] = tmp;
    }
  }
  /* sommer un tableau sur un champ donné en paramètre */
  function sommechamp(t, champ) {
    var s = 0;
    for (var i = 0, n = t.length; i < n ; i += 1) {
      s += t[i][champ];
    }
    return s;
  }
  /* indice du maximum selon un champ */
  function imaxchamp(t, champ,  n) {
    var imax = 0;
    if (typeof(n) == "undefined") {
      n = t.length;
    }
    for (var i = 1; i < n ; i += 1) {
      if (t[i][champ] > t[imax][champ]) {
        imax = i;
      }
    }
    return imax;
  }

  /* trier par ordre croissant selon un champ */
  function trierchamp(t, champ) {
    for (var i = t.length - 1; i >= 1; i -= 1) {
      var tmp = t[i];
      var imax = imaxchamp(t, champ, i + 1);
      t[i] = t[imax];
      t[imax] = tmp;
    }
  }


  /*
   * Le canevas
   */
  var svg = d3.select(opt.div).append("svg:svg")
            .attr("width", width)
            .attr("height", height);

  /* un fond */
  svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#FEFEFE")
            .attr("stroke", "#333333");


  /* les groupes graphiques */
  var chapo = svg.append("g")
              .attr("transform", "translate(40, 10)")
              .append("text")
              .attr("font-size", "1.2em")
              .attr("font-weight", "bold")
              .attr("font-style", "italic")
              .attr("dy", 10);

  var g = svg.append("g")
  .attr("transform", "translate(40, 30)");
  g.append("text").text("Entreprises :").attr("dy", 14);

  var g2 = svg.append("g")
  .attr("transform", "translate(40, "+ (height - 40) +")");
  g2.append("text").text("Ménages :").attr("dy", 14);

  var  log = svg.append("g")
              .attr("transform", "translate(550, "+ height +" )");


  /* mise en place d'un chapeau */
  function updatechapo(chapo, s, duree) {
    chapo
    .style("fill", "white")
    .attr("dx", -600)
    .transition().duration(D(duree))
    .style("fill", "#333333")
    .attr("dx", 0)
    .text(s);
  }

  /* mise en place de logs */
  var logoffset = 0;
  function updatelog(log, s, duree, couleurfond) {
    logoffset += 1;

    log
    .transition().duration(D(duree))
    .attr("transform", "translate(550, "+ (height -1 - 12 * logoffset) + ")");

    var w = 100;

    if (typeof(couleurfond) == "undefined") {
      couleurfond = "#333333";
    }
    var fond = log.append("rect") //insert
               .attr("x", "-1px")
               .attr("y", 12 * logoffset - 8)
               .attr("height", "10px")
               .transition().duration(D(duree))
               .style("fill", couleurfond);

    var texte = log
                .append("text")
                .attr("fill", "#CCCCCC")
                .attr("font-weight", "bold")
                .attr("font-size", "0.8em")
                .attr("font-family", "monospace")
                .attr("dy", 12 * logoffset)
                .text(s);

    w = texte[0][0].getBBox();
    fond.attr("width", w.width+2)
  }


  /* ENTREPRISES */
  function updateentreprises (g, duree) {
    /* suprimer l'ancienne vue */
    g.selectAll("g").remove();
    /* Jointure, sur l'id */
    var svgent = g.selectAll("g")
                 .data(entreprises, getid);

    var subd = 25;

    /* traiter les données entrantes (enter) */
    var entgroups = svgent.enter()
                    .append("g")
                    .attr("transform",
                          function (d) {
                            return "translate(100,"  + (d.i * 55) + ")";})


    /* rectangle de fond (les salariés) */
    entgroups
    .append("rect")
    .attr("height", "18px")
    .attr("y", "1px")
    .attr("x", "1px")
    .attr("width", function (d) {return subd * d.sal;})
    .style("fill", getcolor);

    /* numéro de l'entreprise */
    entgroups.append("text")
    .text(geti)
    .attr("dy", "1em")
    .attr("dx", "-0.2em")
    .style("text-anchor", "end");

    /* subdivisions  salariés */
    entgroups.each(function (d, i) {
      var e = d3.select(this);
      /* rectangle coloré autour */
      e.append("rect")
      .attr("width", function (d) {return subd * d.obj;})
      .attr("height", "20px")
      .style("fill", "none")
      .style("stroke", getcolor);
      /* séparations verticales intérieures tous les subd px (couleur) */
      for (var i = 1, n = d.obj; i < n; i += 1) {
        e.append("line")
        .attr("x1", i * subd)
        .attr("x2", i * subd)
        .attr("y1", 1)
        .attr("y2", 19)
        .attr("stroke", getcolor);
      }
      /* séparations verticales intérieures tous les subd px (blanc) */
      for (var i = 1, n = d.sal; i <= n; i += 1) {
        e.append("line")
        .attr("x1", i * subd)
        .attr("x2", i * subd)
        .attr("y1", 1)
        .attr("y2", 19)
        .attr("stroke", "white");
      }
    }); // fin .each

    if (opt.avecbiens) {
      /* mot "stock" (légende) */
      entgroups.append("text")
      .text("stock")
      .attr("dy", "30")
      .attr("dx", "-0.2em")
      .attr("font-size", "0.8em")
      .attr("font-family", "monospace")
      .style("text-anchor", "end");

      /* rectangle des stocks */
      entgroups
      .append("rect")
      .attr("height", "4px")
      .attr("y", "25px")
      .attr("x", "0px")
      .style("fill", getcolor)
      .attr("width", function (d) {return subd * d.stocko / productivite;})
      .transition().duration(D(duree))
      .attr("width", function (d) {return subd * d.stock / productivite;});

      /* animer le stock une seule fois */
      for (var i = 0, n = entreprises.length; i < n; i += 1) {
        entreprises[i].stocko = entreprises[i].stock;
      }


      /* si le stock est vide afficher "vide" */
      entgroups.append("text")
      .transition().duration(D(duree))
      .text(function (d) { var s; s = (d.stock <= 0)?"vide":""; return s;})
      .attr("dy", "30")
      .attr("dx", "0.2em")
      .attr("font-size", "0.8em")
      .attr("font-family", "monospace")
      .style("text-anchor", "start");
    }
    if (opt.avecmonnaie) {
      /* mot "prix unitaire" (légende) */
      entgroups.append("text")
      .text("prix unitaire")
      .attr("dy", "40")
      .attr("dx", "-0.2em")
      .attr("font-size", "0.8em")
      .attr("font-family", "monospace")
      .style("text-anchor", "end");

        /* prix unitaire */
      entgroups.append("text")
      .text(getpu)
      .attr("dy", "40")
      .attr("dx", "0.2em")
      .attr("font-size", "0.8em")
      .attr("font-family", "monospace")
      .style("text-anchor", "start");

      /* solde (légende) */
      entgroups.append("text")
      .text("solde")
      .attr("dy", "50")
      .attr("dx", "-0.2em")
      .attr("font-size", "0.8em")
      .attr("font-family", "monospace")
      .style("text-anchor", "end");

      /* solde */
      entgroups.append("text")
      .text(getsolde)
      .attr("dy", "50")
      .attr("dx", "0.2em")
      .attr("font-size", "0.8em")
      .attr("font-family", "monospace")
      .style("text-anchor", "start");
    }

    /* traiter les éléments en excès (exit) */
    svgent.exit().remove();
    }// fin updateentreprises


  /* MENAGES */
  function updatemenages (g2, duree, avecconso) {
    if (typeof(avecconso) == "undefined") {avecconso = false;}
    /* supprimer l'ancienne vue */
    g2.selectAll("g").remove();
    /* Jointure, sur l'id */
    var svgmen = g2.selectAll("g")
                 .data(menages, getid);

    var subd = 30;

    /* traiter les données entrantes (enter) */
    var mengroups = svgmen.enter()
                    .append("g");

    mengroups.attr("transform", function (d) {return "translate("  + (d.ido * subd + 100) + ", 0)";}).transition().duration(D(duree)).attr("transform", function (d) {return "translate("  + (d.id * subd + 100) + ", 0)";});


    /* carré */
    mengroups.append("rect")
      .attr("width", subd - 6)
      .attr("x", 3)
      .attr("height", "20px")
      .style("fill", getmecolor)
      .style("stroke", "black");
    /* numéro du ménage  */
    mengroups.append("text")
    .text(geti)
    .attr("dy", "1em")
    .attr("dx", "1em")
    .style("text-anchor", "middle");

    if (opt.avecmonnaie) {
      /* solde */
      mengroups.append("text")
      .text(getsolde)
      .attr("dy", "-2px")
      .attr("dx", "28px")
      .attr("font-size", "0.8em")
      .attr("font-family", "monospace")
      .style("text-anchor", "end");
    }

    if (avecconso) {
      /* barres de consommation */
      mengroups.select("g").remove();
      var gconso = mengroups.append("g")
                 .attr("transform", "translate(0, 20)");
      function barresconso (d, i) {
        var b;
        var len;
        for (var i = 0, n = d.conso.length; i < n; i += 1) {
          var color = d.conso[i].couleur;
          len = d.conso[i].quantite;

          b = d3.select(this).append("rect")
               .attr("x", 3*i + 2)
               .attr("y", 2)
              .attr("width", "2px")
              .attr("height", len)
              .style("fill", color);
        }
        /* derniere barre s'anime */
        if (typeof(b) != "undefined") {
          b.attr("height", "0px")
          .transition().duration(duree/2)
          .attr("height", len)
        }
      };
      gconso.each(barresconso);
    }

    /* traiter les éléments en excès (exit) */
    svgmen.exit().remove();


    /* pour que la transition ido -> id n'est plus d'effet visible */
    for (var i = 0, n = menages.length; i < n; i += 1) {
      menages[i].ido = menages[i].id;
    }
  }// fin updatemenages


  function produire() {
    for (var i = 0, n = entreprises.length; i < n; i += 1) {
      entreprises[i].stocko = entreprises[i].stock;
      entreprises[i].stock += productivite * entreprises[i].sal;
    }
  };

  function nouvelobjectif() {
    for (var i = 0, n = entreprises.length; i < n; i += 1) {
      entreprises[i].obj =
        max(1, Math.round((entreprises[i].sal + entreprises[i].obj + alea(10) - 4)/2));
      entreprises[i].pu += aleanorm(entreprises[i].pu - 5);
    }
    if (tour == 1) {
      entreprises[0].obj = entreprises[0].sal - 1;
      entreprises[1].obj = entreprises[1].sal + 1;
      entreprises[2].obj = entreprises[2].sal - 1;
    }
  };

  function licencier(f) {
    for (var i = 0, n = entreprises.length; i < n; i += 1) {
      while (entreprises[i].obj < entreprises[i].sal) {
        var e = entreprises[i].i; /* la boite ! e = i tout le temps ? */
        var d = tour; /* date derniere embauche dans la boite */
        var mj = 0; /* dernier embauché dans la boite */
        for (var j = 0, m = menages.length; j < m; j += 1) {
          if ((menages[j].employeur == e) && menages[j].date < d) {
            d = menages[j].date;
            mj = j;
          }
        }
        /* licencier */
        menages[mj].employeur = null;
        entreprises[i].sal -= 1;
        if (typeof(f) == "function") {
          f(e, menages[mj].i);
        }
      }
    }
  }

function embaucher(f) {
  var i = 0;
  var offres = sommechamp(entreprises, "obj") - sommechamp(entreprises, "sal");
  var n = menages.length;
  while ((offres > 0) && (i < n)){
    if (menages[i].employeur == null) {
      /* choix d'une entreprise offrant du travail au hasard */
      melanger(entreprises);
      var j = 0;
      while(entreprises[j].sal >= entreprises[j].obj) {j += 1};
      var e = entreprises[j].i;
      entreprises[j].sal += 1;
      menages[i].employeur = e;
      menages[i].date = tour;
      offres -= 1;
      var message;
      if (typeof(f) == "function") {
        f(e, menages[i].i);
      }
    }
    i += 1;
  }
}

/* Salaires */
function paiement_salaires() {
  trierchamp(entreprises, "i");
  for (var i = menages.length - 1; i >= 0; i -= 1) {
    var j = menages[i].employeur;
    if (j != null) {
      menages[i].solde += salaire_unique;
      entreprises[j].solde -= salaire_unique;
    }
  }
}

/* Crédit TODO */

/* Consommation */
function prep_conso() {
  trierchamp(entreprises, "pu");
  melanger(menages);
}

function post_conso() {
    for (var i = 0, n = menages.length; i < n; i += 1) {
      menages[i].conso = [];
      menages[i].dem = 90;
    }
}

  function step_conso() {
    var offres = sommechamp(entreprises, "stock");
    var demandes = sommechamp(menages, "dem");
    var encore = false; /* encore des ménages sovables ? */
    if ((offres > 0) && (demandes > 0)){
      for (var i = 0, n = menages.length; i < n; i += 1) {
        var j = 0; /* meilleure offre du marché */
        var k = entreprises.length;
        while ((j < k) && (0 >= entreprises[j].stock)) {j += 1;}
        if (j == k) {return false;} // <--- sortie prématurée (plus  d'offre)
        if (menages[i].solde > entreprises[j].pu) {
          /* i va consommer chez j, une quantité à déterminer */
          var q = min(Math.floor(menages[i].solde / entreprises[j].pu), /* limite de solvabilité */
                      min(entreprises[j].stock,                         /* limite de stock */
                          min(menages[i].dem,                           /* limite de demande */
                              max_pack_conso)));                                     /* limite logistique */
          /* flux de biens */
          entreprises[j].stock -= q;
          var pack = {"couleur": entreprises[j].couleur,
                                 "entreprise": entreprises[j].id,
                                 "quantite": q
                                };
          menages[i].conso.push(pack);
          menages[i].dem -= q;
          /* flux monétaire */
          var m = q * entreprises[j].pu;
          menages[i].solde -= m;
          entreprises[j].solde += m;
          /* relancer un tour de consommation après celui ci */
          encore = true;
        } else { /* i n'est plus solvable */
          menages[i].dem = 0;
        }
      }
    }
    return encore;
  }


  /* ANIMATION */
  /* initialisation des donnees */
  initialisationdonnees();

  /* création de l'animation */
  var animation = [];

  animation.push({
    "d": 5000,
    "f": function () {
      var message;
      message = "Exemple avec "
              + entreprises.length
              + " entreprises et "
              + menages.length
              + " ménages.";
      updatechapo(chapo, message, 500);
      updateentreprises(g, 500);
      updatemenages(g2, 1500);
    }
  });


  if (opt.detaillerzero) {

    if (!opt.rebouclertourzero) {
      animation.push({
        "d": 10,
        "f": function () {
          var message = "// Tour "+tour+" /////////////////";
          updatechapo(chapo, "Tour "+tour, 500);
          updatelog(log, message, 500, "#339933");
        }
      });
    }

    animation.push({
      "d": 5000,
      "f": function () {
      var message;
        message = "Les entreprises proposent des emplois";
        entreprises[0].obj = 3;
        entreprises[1].obj = 6;
        entreprises[2].obj = 2;
        updatechapo(chapo, message, 500);
        updateentreprises(g, 4000);
      }
    });
    animation.push({
      "d": 3000,
      "f": function () {
        var message;
        message = "Les embauches se font au hasard";
        updatechapo(chapo, message, 500);
        melanger(entreprises);
      melanger(menages);
        updateentreprises(g, 500);
        updatemenages(g2, 1500);
      }
    });

    /* serie de push tous identiques pour animer les 11 premieres embauches */
    for (var i = 0, n = 11; i < n; i += 1) {
      (function (i) {// mon vieux truc pour ne pas se prendre les pieds dans la clôture
        animation.push({
          "d": opt.rebouclertourzero?3000:500,
          "f": function () {
            melanger(entreprises);
            var m = menages[i].i;
            var e;
            var j = 0;
            while(entreprises[j].sal >= entreprises[j].obj) { j += 1};
            e = entreprises[j].i;
            entreprises[j].sal += 1;
            menages[i].employeur = e;
            menages[i].date = tour;
            var message;
            message = "-- l'entreprise "+e+" embauche le ménage "+m;
            updatechapo(chapo, message, 500);
            updatelog(log, message, 500);
            updateentreprises(g, 500);
            updatemenages(g2, opt.rebouclertourzero?1500:500);
          }
        });
      })(i);
    }


    /* reboucler */
    if (opt.rebouclertourzero) {
    /* pose de 12s avec message à 10s */
      animation.push({
        "d": 10000,
        "f": function () {}
      });

      /* reboucle */
      animation.push({
        "d": 2000,
        "f": function () {
        updatelog(log, " ", 100);
        updatelog(log, " ", 100);
        updatelog(log, " * Remise à zéro de l'animation * ", 200, "#EE0000");
        updatelog(log, " ", 300);
        initialisationdonnees();
          frame = -1; /* force un zéro pour le frame suivant */
        }
      });
    }//fin reboucler

    /* production */
    animation.push({
      "d": 5000,
      "f": function () {
        produire();
        var message;
        message = "Production";
        updatechapo(chapo, message, 500);
        updatelog(log, "3. Salaires et marché du crédit (à faire)", 200);
        updatelog(log, "4. "+message, 500);
        updateentreprises(g, 4000);
      }
    });
  }// fin de détailler tour zéro
  else {
    animation.push({
      "d": 10,
      "f": function () {
        entreprises[0].obj = 3;
        entreprises[1].obj = 6;
        entreprises[2].obj = 2;
        tour = -1;
      }
    });
  }
  var revenirici; /* debut des tours réguliers */
  animation.push({
    "d": 1000,
    "f": function () {
      revenirici = frame; //<-- sauvegarde du numero du frame
    }
  });

  animation.push({
    "d": 5000,
    "f": function () {
      tour += 1;
      var message = "// Tour "+tour+" /////////////////";
      updatechapo(chapo, "Tour "+tour, 500);
      updatelog(log, message, 500, "#339933");
    }
  });

  animation.push({
    "d": 5000,
    "f": function () {
      var message = "Nouveaux objectifs de production";
      updatechapo(chapo, message, 500);
      updatelog(log, "1. " + message, 500);
      trierchamp(entreprises, "i"); // logs plus jolis
      nouvelobjectif();
      updateentreprises(g, 4000);
    }
  });


  animation.push({
    "d": 5000,
    "f": function () {
      var message = "Marché du travail";
      updatechapo(chapo, message, 500);
      updatelog(log, "2. "+message, 500);
      melanger(menages);
      updatemenages(g2, 500);
    }
  });



  animation.push({
    "d": 5000,
    "f": function () {
      var doitlicencier = false;
      for (var i = 0, n = entreprises.length; i < n && !doitlicencier; i += 1) {
        if (entreprises[i].sal > entreprises[i].obj) {
          doitlicencier = true;
        }
      }
      if (doitlicencier) {
        var message = "Licenciements";
        updatechapo(chapo, message, 500);
        updatelog(log, "a. "+message, 200);
        var retardlog = 210;
        licencier(function (boite, salarie) {
          retardlog += 10;
          updatelog(log,
                    "-- l'entreprise "+boite+
                    " licencie le ménage "+salarie,
                    retardlog);
        });
        updateentreprises(g, 500);
        updatemenages(g2, 500);
      } else {
        var message = "Pas de licenciements";
        updatechapo(chapo, message, 500);
        updatelog(log, "a. "+message, 500);
      }
    }
  });

  var doitembaucher = false;
  /* remélanger avant embauches (2 frames pour les embauches) */
  animation.push({
    "d": 500,
    "f": function () {
      for (var i = 0, n = entreprises.length;
           (i < n) && !doitembaucher;
           i += 1) {
        if (entreprises[i].sal < entreprises[i].obj) {
          doitembaucher = true;
        }
      }
      if (doitembaucher) {
        melanger(menages);
        updatemenages(g2, 500);
      }
    }
  });

  animation.push({
    "d": 5000,
    "f": function () {
      if (doitembaucher) {
        var message = "Embauches";
        updatechapo(chapo, message, 200);
        updatelog(log, "b. "+message, 200);
        var retardlog = 210;
        embaucher(function (boite, salarie) {
          retardlog += 10;
          updatelog(log,
                    "-- l'entreprise "+boite+
                    " embauche le ménage "+salarie,
                    retardlog);
        });
        updateentreprises(g, 500);
        updatemenages(g2, 500);
      } else {
        var message = "Pas d'offre d'embauches";
        updatechapo(chapo, message, 500);
        updatelog(log, "b. "+message, 500);
      }
    }
  });

  if (opt.avecmonnaie) {
  /* Salaires et marché du crédit */
  animation.push({
      "d": 3000,
      "f": function () {
        var message = "Paiement des salaires et marché du crédit (à terminer)";
        paiement_salaires();
        updatelog(log, "3. "+message, 200);
        updatechapo(chapo, message, 500);
        updatemenages(g2, 100);
      }
    });

  /* Production */
  animation.push({
      "d": 5000,
      "f": function () {
        var message;
        message = "Production";
        updatechapo(chapo, message, 500);
        updatelog(log, "4. "+message, 500);
        produire();
        updateentreprises(g, 4000);
      }
    });



  /* Consommation */
  animation.push({
      "d": 2000,
      "f": function () {
        var message;
        message = "Consommation";
        updatechapo(chapo, message, 500);
        updatelog(log, "5. "+message, 500);
        prep_conso();
        accel = 1;
        updatemenages(g2, 2000);
      }
  });

  animation.push({
      "d": 1000,
      "f": function () {
        if (step_conso()) {
          frame -= 1; // <-- on bouclera sur le frame actuel
          updateentreprises(g, 1000);
          updatemenages(g2, 1000, true);
        }
      }
  });

  animation.push({
      "d": 3000,
      "f": function () {
        var message;
        message = "fin de la phase consommation";
        updatelog(log, "  "+message, 500);
        post_conso();
      }
  });
  } // fin avecmonnaie

// recommencer 9 tours ///////////
 animation.push({
    "d": 10,
    "f": function () {
      if (tour < opt.nbmaxtours) {
        frame = revenirici; /* retournera au frame revenirici */
      }
    }
  });

 animation.push({
    "d": 1000,
    "f": function () {
      var message = "Fin de l'animation";
      updatechapo(chapo, message, 500);
      updatelog(log, message, 500, "#EE0000");
    }
  });

  /*
   * ANIMATION
   */
  /* accélerer l'animation */
  var accel = 1;
  function D(d) {
    return max(Math.floor(d / accel), 1);
  }
  function animer () {
    //    updatelog("frame " + frame, 1);
    animation[frame].f();

    if (frame < animation.length - 1) {
      setTimeout(function () {
        frame += 1;
        animer(); /* <-- récursion */
      },  D((frame < 0)?1:animation[frame].d));
    }
  }

  // C'est parti !
  animer();
};