<template>
<q-layout view="hHh LPR lfr">
  <q-header elevated>
    <q-toolbar>
      <bouton-help page="page1"/>

      <bouton-langue style="position:relative;top:2px;"/>

      <!-- Dark ou clair -->
      <q-btn dense size="md" icon="contrast" @click="tgdark">
        <q-tooltip>{{$t('clairfonce')}}</q-tooltip>
      </q-btn>

      <!-- Outils et tests -->
      <q-btn dense size="md" icon="settings" @click="ui.oD('PAoutilsTests')">
        <q-tooltip>{{$t('MLAout')}}</q-tooltip>
      </q-btn>

      <!-- Information session : mode synchro -->
      <q-btn class="q-mr-xs" v-if="session.synchro" @click="infoSession()"
        dense size="md" icon="autorenew" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
        <queue-icon/>
      </q-btn>

      <!-- Information session : mode incognito -->
      <q-avatar class="cursor-pointer q-mr-xs" v-if="session.incognito" @click="infoSession()"
        size="sm" square color="primary">
        <img src="~assets/incognito_blanc.svg">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-avatar>

      <!-- Information session : mode avion -->
      <q-btn class="cursor-pointer q-mr-xs" v-if="session.avion" @click="infoSession()"
        dense size="md" icon="airplanemode_active" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
        <queue-icon/>
      </q-btn>

      <!-- Notifications -->
      <notif-icon2 v-if="session.status === 2" class="q-ml-xs" :alire="session.alire" :niv="session.niv" 
        @click="clickNotif" apptb/>

      <q-toolbar-title class="titre-md text-right cursor-pointer q-mx-xs">
        <span v-if="session.ok" class="titre-lg">{{aSt.avC.na.nomc}}</span>
        <span v-else class="titre-md text-italic">{{$t('MLAsfer')}}</span>
        <span v-if="session.org" class="q-ml-md titre-md">[{{session.org}}]</span>
      </q-toolbar-title>

      <!-- Déconnexion -->
      <q-btn v-if="session.status > 1" dense size="md" color="warning" icon="logout"
        @click="discon">
        <q-tooltip>{{$t('MLAdrc')}}</q-tooltip>
        <span class="fs-sm font-mono">{{hms(session.dh)}}</span>
      </q-btn>
    </q-toolbar>

    <q-toolbar inset class="full-width bg-secondary text-white">
      <bouton-help page="page1"/>
      <q-btn v-if="session.ok && !session.estMinimal" size="md" icon="menu">
        <q-menu v-model="ui.menug" max-height="90vh" class="bg-secondary text-white">
          <page-menu menu/>
        </q-menu>
      </q-btn>
      <q-btn :disable="!aHome" flat icon="home" size="md" 
        :color="aHome ? 'warning' : 'grey'" dense @click="gotoAccueilLogin()"/>
      <q-btn v-if="ui.pageback" flat icon="arrow_back" size="md" 
        dense @click="gotoBack()"/>
      <q-toolbar-title class="titre-lg text-center"><span>{{titrePage}}</span>
      </q-toolbar-title>

      <q-btn v-if="aUnFiltre" color="warning"
        dense size="md" icon="search" @click="ouvrFiltre">
        <q-tooltip>{{$t('MLAfiltre')}}</q-tooltip>
      </q-btn>

      <!-- Fichiers avion -->
      <q-btn v-if="session.ok" :disable="session.incognito" dense size="md" icon="save"
        @click="pageFicavion">
        <q-tooltip>{{$t('MLAfav')}}</q-tooltip>
      </q-btn>

      <!-- Presse papier -->
      <q-btn v-if="session.ok" dense size="md" icon="content_paste"
        @click="ui.oD('pressepapier')">
        <q-tooltip>{{$t('MLApp')}}</q-tooltip>
      </q-btn>

    </q-toolbar>

    <q-toolbar v-if="ui.page === 'compta'" inset 
      class="full-width bg-secondary text-white row justify-between">
      <q-tabs  class="col titre-md" v-model="ui.pagetab" inline-label outside-arrows mobile-arrows no-caps>
        <q-tab name="notif" :label="$t('PNCntf')" @click="ui.setTab('notif')"/>
        <q-tab name="compta" :label="$t('PNCabo')" @click="ui.setTab('compta')"/>
        <q-tab v-if="session.estComptable || aSt.compta.estA"
          name="credits" :label="$t('PNCcre')" @click="ui.setTab('credits')"/>
        <q-tab name="chats" :label="$t('PNCchats')" @click="ui.setTab('chats')"/>
      </q-tabs>
      <q-btn v-if="ui.pagetab==='notif' && session.alire" 
        class="col-auto q-px-sm" dense size="md" color="warning" 
        icon="check" :label="$t('jailu')" @click="ui.jailu()"/>
    </q-toolbar>

    <q-toolbar v-if="ui.page === 'groupe'" inset 
      class="full-width bg-secondary text-white row justify-between">
      <q-tabs  class="col titre-md" v-model="ui.pagetab" inline-label outside-arrows mobile-arrows no-caps>
        <q-tab name="groupe" :label="$t('ACtgr')" @click="ui.setTab('groupe')"/>
        <q-tab name="membres" :label="$t('ACtmb')" @click="ui.setTab('membres')"/>
      </q-tabs>
    </q-toolbar>

  </q-header>

  <q-drawer v-model="pfiltre" side="right" elevated bordered persistent
    :width="250" :breakpoint="seuillarge" :overlay="etroite">
    <q-scroll-area :class="'fit ' + dkli(1)">
      <div>
        <div class="row justify-bettween q-mb-md">
          <q-btn class="q-mr-sm" icon="chevron_right" 
            color="warning" size="md" dense @click="fermFiltre"/>
          <div class="titre-lg">{{$t('MLArech')}}</div>
        </div>
        <div v-if="ui.page === 'chats'" class="column justify-start">
          <filtre-rac nom="chats" prop='rac' :idx="0"/>
          <filtre-nbj nom="chats" prop='nbj' :idx="1"/>
          <filtre-nom nom="chats" prop='nom' :idx="0"/>
          <filtre-txt nom="chats" prop='txt' :idx="1"/>
          <filtre-mc nom="chats" attr="mcp" :idx="0"/>
          <filtre-mc nom="chats" attr="mcn" :idx="1"/>
        </div>
        <div v-if="ui.page === 'espace'" class="column justify-start">
          <filtre-tri nom="espace" :nb-options="19" :idx="0"/>
        </div>
        <div v-if="ui.page === 'tranche'" class="column justify-start">
          <filtre-nom nom="tranche" prop='nomc' :idx="0"/>
          <filtre-notif nom="tranche" :idx="1"/>
          <filtre-avecsp nom="tranche" :idx="0"/>
          <filtre-tri nom="tranche" :nb-options="9" :idx="1"/>
        </div>
        <div v-if="ui.page === 'people'" class="column justify-start">
          <filtre-nom nom="people" prop='nom' :idx="0"/>
          <filtre-tribu nom="people" :idx="1"/>
          <filtre-avecgr nom="people" :idx="0"/>
          <filtre-mc nom="people" attr="mcp" :idx="0"/>
          <filtre-mc nom="people" attr="mcn" :idx="1"/>
        </div>
        <div v-if="ui.page === 'groupes'" class="column justify-start">
          <filtre-nom nom="groupes" prop='ngr' :idx="0"/>
          <filtre-txt nom="groupes" prop='infmb' :idx="1"/>
          <filtre-mc nom="groupes" attr="mcp" :idx="0"/>
          <filtre-mc nom="groupes" attr="mcn" :idx="1"/>
          <filtre-sansheb nom="groupes" attr="sansheb" :idx="0"/>
          <filtre-enexcedent nom="groupes" attr="excedent" :idx="1"/>
          <filtre-ainvits nom="groupes" attr="invits" :idx="0"/>
        </div>
        <div v-if="ui.page === 'groupesac'" class="column justify-start">
          <filtre-nom nom="groupes" prop='ngr' :idx="0"/>
          <filtre-txt nom="groupes" prop='infmb' :idx="1"/>
          <filtre-mc nom="groupes" attr="mcp" :idx="0"/>
          <filtre-mc nom="groupes" attr="mcn" :idx="1"/>
          <filtre-sansheb nom="groupes" attr="sansheb" :idx="0"/>
          <filtre-enexcedent nom="groupes" attr="excedent" :idx="1"/>
          <filtre-ainvits nom="groupes" attr="invits" :idx="0"/>
        </div>
        <div v-if="ui.page === 'groupe'" class="column justify-start">
          <filtre-nom nom="groupe" prop='nmb' :idx="0"/>
          <filtre-stmb nom="groupe" prop="stmb" :idx="1"/>
          <filtre-ambno nom="groupe" prop="ambno" :idx="0"/>
        </div>
        <div v-if="ui.page === 'notes'" class="column justify-start">
          <filtre-avgr nom="notes" prop='avgr' :idx="0"/>
          <filtre-nbj nom="notes" prop='nbj' :idx="1"/>
          <filtre-txt nom="notes" prop='note' :idx="0"/>
          <filtre-mc nom="notes" attr="mcp" :idx="1"/>
          <filtre-mc nom="notes" attr="mcn" :idx="0"/>
          <filtre-vols nom="notes" attr="v2" :idx="1"/>
        </div>
      </div>
    </q-scroll-area>
  </q-drawer>

  <q-page-container>
    <transition-group appear
      leave-active-class="animated animate__slideOutLeft"
      enter-active-class="animated animate__slideInRight">
      <div v-if="ui.page === 'null'">
      </div>
      <page-admin class="page" v-if="ui.page === 'admin'"/>
      <page-login class="page" v-if="ui.page === 'login'"/>
      <page-clos class="page" v-if="ui.page === 'clos'"/>
      <page-session class="page" v-if="ui.page === 'session'"/>
      <page-accueil class="page" v-if="ui.page === 'accueil'"/>
      <page-compte class="page" v-if="ui.page === 'compte'"/>
      <page-sponsorings class="page" v-if="ui.page === 'sponsorings'"/>
      <page-chats class="page" v-if="ui.page === 'chats'"/>
      <page-compta class="page" v-if="ui.page === 'compta'"/>
      <page-espace class="page" v-if="ui.page === 'espace'" :ns="session.ns"/>
      <page-tranche class="page" v-if="ui.page === 'tranche'"/>
      <page-people class="page" v-if="ui.page === 'people'"/>
      <page-groupes tous class="page" v-if="ui.page === 'groupes'"/>
      <page-groupes class="page" v-if="ui.page === 'groupesac'"/>
      <page-groupe class="page" v-if="ui.page === 'groupe'"/>    
      <page-notes class="page" v-if="ui.page === 'notes'"/>    
      <page-ficavion class="page" v-if="ui.page === 'ficavion'"/>    
    </transition-group>
  </q-page-container>

  <q-dialog v-model="ui.aunmessage" seamless position="bottom">
    <div :class="'q-pa-sm cursor-pointer ' + (ui.message.important ? 'msgimp' : 'text-white bg-grey-9')"  
      @click="ui.effacermessage">
      {{ ui.message.texte }}
    </div>
  </q-dialog>

  <q-dialog v-model="ui.d.diag" persistent>
    <q-card :class="lidk + ' petitelargeur q-pa-sm'">
      <div class="text-center titre-lg q-my-sm">{{$t('UTIatt')}}</div>
      <div class="fs-md text-center q-b-md" v-html="ui.diag"></div>
      <q-btn flat dense color="primary" size="md" :label="$t('jailu')"
        @click="ui.fD(); ui.diagresolve()"/>
    </q-card>
  </q-dialog>

  <q-dialog v-model="ui.d.confirmFerm" persistent>
    <q-card :class="lidk + ' petitelargeur q-pa-sm'">
      <q-card-section class="q-my-lg titre-md">{{$t('EMDqss')}}</q-card-section>
      <q-card-actions vertical align="right">
        <q-btn flat :label="$t('EMDjr')" color="primary" @click="ui.fD" />
        <q-btn flat :label="$t('EMDjq')" color="warning" @click="fermerqm" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="ui.d.dialoguedrc" persistent>
    <q-card class="bs petitelargeur">
      <q-toolbar class="bg-secondary text-white">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('MLAdrc')}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-card-actions vertical align="center">
        <q-btn class="w15" dense size="md" color="warning"
          icon="logout" :label="$t('MLAdecon')" @click="deconnexion"/>
        <q-btn class="q-ma-xs w15" dense size="md" color="warning"
          icon="logout" :label="$t('MLArecon')" @click="reconnexion"/>
        <q-btn class="q-ma-xs w15" dense size="md" color="primary"
          :label="$t('MLAcont')" @click="ui.fD"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <dialogue-erreur v-if="ui.d.dialogueerreur"/>
  <dialogue-help v-if="ui.d.dialoguehelp"/>
  <presse-papier v-if="ui.d.pressepapier"/>
  <panel-people v-if="ui.d.detailspeople"/>
  <panel-membre v-if="ui.d.PMdetailsmembre"/>
  <outils-tests v-if="ui.d.PAoutilsTests"/>
  <dialogue-notif v-if="ui.d.DNdialoguenotif"/>

  <q-dialog v-model="ui.d.opDialog" seamless position="top" full-width persistent
    transition-show="scale" transition-hide="scale">
    <div class="q-mt-sm column items-center">
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
        <div v-if="session.opSpinner >= 2" 
          class="spinlargeur height-4 row items-center justify-between no-wrap text-black bg-amber-2 q-pa-sm"
          style="margin:0 auto; overflow:hidden;">
          <div class="col column items-center">
            <div class="text-bold">{{$t('MLAbrk')}}</div>
            <div class="text-bold">{{session.opEncours.nom}}</div>
          </div>
          <div class="col-auto q-mt-sm cursor-pointer column items-center" style="position:relative"
            @click="ui.oD('confirmstopop')">
            <q-spinner color="primary" size="3rem" :thickness="4"/>
            <q-badge color="negative" class="text-white stopbtn">{{session.opSpinner}}</q-badge>
          </div>
        </div>
      </transition>
    </div>
  </q-dialog>

  <q-dialog v-model="ui.d.confirmstopop">
    <q-card class="bs">
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('MLAcf', [session.opEncours ? session.opEncours.nom : '???'])}}</q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="$t('MLAcf3')" color="warning" @click="ui.fD"/>
        <q-btn flat :label="$t('MLAcf4')" color="primary" @click="stopop"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</q-layout>
</template>

<script>
import { useQuasar } from 'quasar'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import stores from './stores/stores.mjs'
import { ID } from './app/api.mjs'
import { set$t, hms, dkli } from './app/util.mjs'
import { reconnexionCompte, deconnexion } from './app/connexion.mjs'

import BoutonHelp from './components/BoutonHelp.vue'
import BoutonLangue from './components/BoutonLangue.vue'
import NotifIcon2 from './components/NotifIcon2.vue'
import QueueIcon from './components/QueueIcon.vue'
import FiltreNom from './components/FiltreNom.vue'
import FiltreTxt from './components/FiltreTxt.vue'
import FiltreMc from './components/FiltreMc.vue'
import FiltreNbj from './components/FiltreNbj.vue'
import FiltreAvecgr from './components/FiltreAvecgr.vue'
import FiltreTribu from './components/FiltreTribu.vue'
import FiltreAvecsp from './components/FiltreAvecsp.vue'
import FiltreTri from './components/FiltreTri.vue'
import FiltreNotif from './components/FiltreNotif.vue'
import FiltreSansheb from './components/FiltreSansheb.vue'
import FiltreEnexcedent from './components/FiltreEnexcedent.vue'
import FiltreAinvits from './components/FiltreAinvits.vue'
import FiltreStmb from './components/FiltreStmb.vue'
import FiltreAmbno from './components/FiltreAmbno.vue'
import FiltreAvgr from './components/FiltreAvgr.vue'
import FiltreVols from './components/FiltreVols.vue'
import FiltreRac from './components/FiltreRac.vue'
import DialogueErreur from './dialogues/DialogueErreur.vue'
import PageMenu from './pages/PageMenu.vue'

// niveau 2
import PageSession from './pages/PageSession.vue'
import PageFicavion from './pages/PageFicavion.vue'
import OutilsTests from './dialogues/OutilsTests.vue'

// Niveau 3
import DialogueHelp from './dialogues/DialogueHelp.vue'
import PageClos from './pages/PageClos.vue'
import PageAccueil from './pages/PageAccueil.vue'
import PressePapier from './dialogues/PressePapier.vue'

// Niveau 4
import PageSponsorings from './pages/PageSponsorings.vue'
import PageEspace from './pages/PageEspace.vue'

// Niveau 5
import PageLogin from './pages/PageLogin.vue'

// Niveau 6
import PageAdmin from './pages/PageAdmin.vue'
import PagePeople from './pages/PagePeople.vue'

// Niveau 7
import PageCompte from './pages/PageCompte.vue'
import PageChats from './pages/PageChats.vue'
import PageCompta from './pages/PageCompta.vue'
import PageNotes from './pages/PageNotes.vue'
import PageTranche from './pages/PageTranche.vue'
import PanelPeople from './dialogues/PanelPeople.vue'

// Niveau 8
import PageGroupes from './pages/PageGroupes.vue'

// Niveau 9
import PanelMembre from './dialogues/PanelMembre.vue'

// Niveau 10
import PageGroupe from './pages/PageGroupe.vue'

import DialogueNotif from './dialogues/DialogueNotif.vue'
export default {
  displayName: 'App',
  name: 'App',

  components: { 
    BoutonHelp, BoutonLangue, NotifIcon2, QueueIcon, OutilsTests,
    PageGroupe, PageGroupes, PageNotes, PageFicavion,
    PageAdmin, PageMenu, PageLogin, PageClos, PageSession, PageAccueil, PageCompte, PageSponsorings, PageChats,
    PageCompta, PageEspace, PageTranche, PagePeople, PanelPeople, PanelMembre,
    FiltreRac, FiltreNom, FiltreTxt, FiltreMc, FiltreNbj, FiltreTri, FiltreNotif,
    FiltreAvecgr, FiltreAvecsp, FiltreTribu, FiltreSansheb, FiltreEnexcedent, FiltreAinvits, FiltreStmb,
    DialogueErreur, DialogueHelp, FiltreAvgr, FiltreVols, FiltreAmbno, PressePapier, DialogueNotif
   },

  computed: {
    lidk () { return !this.$q.dark.isActive ? 'sombre0' : 'clair0' },
    tbclass () { return this.$q.dark.isActive ? ' sombre1' : ' clair1' },
    aHome () { return (this.session.status === 2 && this.ui.page !== 'accueil')
      || (!this.session.status && this.ui.page !== 'login') },
    pccl () {return this.aSt.compta.pc < 80 ? 'bg-transparent' : (this.aSt.compta.pc < 100 ? 'bg-yellow-3' : 'bg-negative') },
    titrePage () {
      const p = this.ui.page
      let arg = ''
      switch (p) {
        case 'espace' : { return this.$t('Pespace', [this.session.ns, this.session.org]) }
        case 'tranche' : { 
          if (this.session.pow > 3) return this.$t('ACspons')
          return this.$t('Ptranche', [ID.court(this.aSt.tribuC.id), this.aSt.tribuC.info])
        }
        case 'sponsorings' : { arg = this.aSt.avC ? this.aSt.avC.na.nom : '?'; break }
        case 'groupesac' : { arg = this.aSt.avC ? this.aSt.avC.na.nom : '?'; break }
        case 'groupe' : { arg = this.gSt.egrC ? this.gSt.egrC.groupe.na.nom : this.$t('disparu'); break }
      }
      return this.$t('P' + p, [arg])
    },
    aUnFiltre () { return this.ui.aFiltre(this.ui.page, this.ui.pagetab)}
},

  // Gère le franchissement du seuil etroit / large
  watch: {
    "$q.screen.width"() {
      const w = this.$q.screen.width
      const et = w < this.seuillarge
      if (et === this.etroite) return
      this.etroite = et
      if (!this.aUnFiltre) this.setPFiltre(false)
      else this.redoPFiltre()
    }
  },

  data () { return {
  }},

  methods: {
    discon () {
      if (this.session.status === 3) deconnexion(); else this.ui.oD('dialoguedrc')
    },

    stopop () {
      const op = this.session.opEncours
      if (op && op.stop) op.stop()
      this.ui.fD()
    },

    tgdark () { this.$q.dark.toggle() },

    clickNotif () {
      this.ui.setPage('compta', 'notif')
    },
    pageFicavion () { 
      this.ui.setPage('ficavion')
    },
    infoSession () { 
      if (this.session.status === 2) this.ui.setPage('session')
    },
    gotoAccueilLogin () {
      this.ui.setPage(this.session.status === 2 ? 'accueil' : 'login')
    },
    fermerqm () {
      this.ui.fD()
      setTimeout(() => { this.ui.fD() }, 50)
    },
    deconnexion () { this.ui.fD(); deconnexion() },
    async reconnexion () { this.ui.fD(); await reconnexionCompte() }
  },

  setup () {
    set$t(useI18n().t)
    const $q = useQuasar()
    $q.dark.set(true)

    const config = stores.config
    config.$q = $q
   
    const session = stores.session
    const aSt = stores.avatar
    const gSt = stores.groupe
    const ui = stores.ui

    const seuillarge = 900
    const etroite = ref($q.screen.width < seuillarge)
    const pfiltre = ref(false)

    function ouvrFiltre () { 
      setPFiltre(!pfiltre.value)
    }

    function fermFiltre () { 
      setPFiltre(false)
    }

    function setPFiltre (v) {
      setTimeout(() => {
        pfiltre.value = v
      }, 200)
    }

    function redoPFiltre () {
      setTimeout(() => {
        pfiltre.value = false
          setTimeout(() => {
            pfiltre.value = true
          }, 200)
      }, 200)
    }

    ui.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTab') {
          const t = args[0]
          if (!ui.aFiltre(ui.page, t)) setPFiltre(false)
          else if (!etroite.value) setPFiltre(true)
        }
      })
    })

    function gotoBack () {
      if (ui.pageback) ui.setPage(ui.pageback)
    }

    const infomode = ref(false)
    const infonet = ref(false)
    const infoidb = ref(false)

    return {
      session, config, ui, aSt, gSt,
      seuillarge, etroite, gotoBack,
      pfiltre, ouvrFiltre, fermFiltre, setPFiltre, redoPFiltre,
      hms, dkli,
      infonet, infoidb, infomode
    }
  }
}
</script>

<style lang="css">
input:placeholder-shown { color: grey !important; font-style:italic }

.animate__slideInRight {
  --animate-duration: 0.2s;
}
.animate__slideOutLeft {
  --animate-duration: 0.2s;
}
/* Sinon les boutons en haut à droite dans toolbar sont partiellement masqués à droite par 
un élément qui apparaît quand le drawer est caché*/
.q-drawer__opener { z-index: 0 !important }
</style>

<style lang="css">
@import 'animate.css'
</style>

<style lang="sass" scoped>
@import './css/app.sass'
.stopbtn
  position: relative
  top: -2rem
.spinlargeur
  width: 15rem
  max-width: 95vw
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 2px !important
.q-item
  min-height: 0 !important
.msgimp
  background-color: $grey-2
  color: $negative
  font-weight: bold
  border: 2px solid $negative
.bdg1
  position: absolute
  top: 6px
  width: 24px
.bg2
  border-radius: 5px
  padding: 2px
.q-tab
  min-height: 0 !important

</style>
