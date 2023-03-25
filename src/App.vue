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
      <q-btn dense size="md" icon="settings" @click="outilsTests = true">
        <q-tooltip>{{$t('MLAout')}}</q-tooltip>
      </q-btn>

      <!-- Information session : mode synchro -->
      <q-btn class="q-mr-xs" v-if="session.synchro" @click="infoSession"
        dense size="md" icon="autorenew" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-btn>

      <!-- Information session : mode incognito -->
      <q-avatar class="cursor-pointer q-mr-xs" v-if="session.incognito"  @click="infoSession"
        size="sm" square color="primary">
        <img src="~assets/incognito_blanc.svg">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-avatar>

      <!-- Information session : mode avion -->
      <q-btn class="cursor-pointer q-mr-xs" v-if="session.avion" @click="infoSession"
        dense size="md" icon="airplanemode_active" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-btn>

      <!-- Comptabilité des volumes -->
      <div v-if="session.status>1" @click="pageCompta" style="position:relative"
        :class="'cursor-pointer q-mr-xs bg2 ' + pccl">
        <q-knob v-model="pc" size="24px" :thickness="1" color="black" track-color="green-9"/>
        <div class="bdg1 text-white bg-transparent text-center text-bold fs-xs font-mono">{{pc + '%'}}</div>
      </div>

      <!-- Notifications -->
      <notif-ico class="q-ml-xs" v-if="session.estComptable" clickable :alire="session.alirentf" 
        :gravite="session.gntf === 2" :neutre="session.gntf === 0" @click="clickNotif"/>
      <notif-ico class="q-ml-xs" v-if="!session.estComptable && session.gntf" clickable :alire="session.alirentf" 
        :gravite="session.gntf === 2" @click="clickNotif"/>

      <!-- Blocages -->
      <blocage-ico class="q-ml-xs" v-if="session.nivbl" clickable :niveau="session.nivbl" :alire="session.alirebl" @click="clickNotif"/>

      <q-toolbar-title class="titre-md text-right cursor-pointer q-mx-xs">
        <q-btn v-if="session.ok" class="titre-lg" dense no-caps 
          :label="session.avC.na.nomc" @click="ouvrirav" />
        <span v-else class="titre-md text-italic">{{$t('MLAsfer')}}</span>
      </q-toolbar-title>

      <!-- Déconnexion -->
      <q-btn v-if="session.ok" dense size="md" color="warning" icon="logout" @click="ui.dialoguedrc = true">
        <q-tooltip>{{$t('MLAdrc')}}</q-tooltip>
        <span class="fs-sm font-mono">{{hms(session.dh)}}</span>
      </q-btn>
    </q-toolbar>

    <q-toolbar inset>
      <q-toolbar-title class="titre-lg text-right cursor-pointer q-mx-md">
        <span v-if="session.groupeId">{{session.grC.na.nomc}}</span>
        <span v-else class="titre-md text-italic">{{$t('MLAngr')}}</span>
      </q-toolbar-title>
    </q-toolbar>
    <q-toolbar inset class="full-width bg-secondary text-white">
      <bouton-help page="page1"/>
      <q-btn :disable="!aHome" flat icon="home" size="md" 
        :color="aHome ? 'warning' : 'grey'" dense @click="gotoAccueilLogin()"/>
      <q-btn v-if="ui.pageback" flat icon="arrow_back" size="md" 
        dense @click="gotoBack()"/>
      <q-toolbar-title class="titre-lg text-center">
        <span>{{$t('P' + ui.page)}}</span>
      </q-toolbar-title>

      <q-btn v-if="ui.etroite && ui.filtre" class='q-mr-sm text-warning'
        dense size="md" icon="search" @click="ouvrFiltre">
        <q-tooltip>{{$t('MLAfiltre')}}</q-tooltip>
      </q-btn>

    </q-toolbar>
  </q-header>

  <q-drawer v-if="ui.filtre" v-model="ui.menu" side="right" elevated persistent
    :width="250" :breakpoint="ui.seuillarge"
    :overlay="ui.etroite">
    <q-scroll-area :class="'q-pa-xs fit ' + dkli(1)">
      <div>
        <div class="row justify-bettween q-mb-md">
          <q-btn v-if="ui.etroite" class="q-mr-sm" icon="chevron_right" color="warning" size="md" dense @click="fermFiltre"/>
          <div class="titre-lg">{{$t('MLArech')}}</div>
        </div>
        <div v-if="ui.page === 'chats'" class="column justify-start">
          <filtre-nbj nom="chats" prop='nbj' :idx="0"/>
          <filtre-nom nom="chats" prop='nom' :idx="1"/>
          <filtre-txt nom="chats" prop='txt' :idx="0"/>
          <filtre-mc nom="chats" attr="mcp" :idx="1"/>
          <filtre-mc nom="chats" attr="mcn" :idx="0"/>
        </div>
        <div v-if="ui.page === 'tribus'" class="column justify-start">
          <filtre-nom nom="tribus" prop='nomt' :idx="0"/>
          <filtre-txt nom="tribus" prop='txtt' :idx="1"/>
          <filtre-txt nom="tribus" prop='txtn' :idx="0"/>
          <filtre-avecbl nom="tribus" :idx="1"/>
          <filtre-notif nom="tribus" :idx="0"/>
          <filtre-tri nom="tribus" :nb-options="7" :idx="1"/>
        </div>
        <div v-if="ui.page === 'tribu'" class="column justify-start">
          <filtre-nom nom="tribu2" prop='nomc' :idx="0"/>
          <filtre-avecsp nom="tribu2" :idx="1"/>
          <filtre-avecbl nom="tribu2" :idx="0"/>
          <filtre-notif nom="tribu2" :idx="1"/>
          <filtre-tri nom="tribu2" :nb-options="3" :idx="0"/>
        </div>
        <div v-if="ui.page === 'people'" class="column justify-start">
          <filtre-nom nom="people" prop='nom' :idx="0"/>
          <filtre-tribu nom="people" :idx="1"/>
          <filtre-avecgr nom="people" :idx="0"/>
        </div>
      </div>
    </q-scroll-area>
  </q-drawer>

  <q-page-container>
    <transition-group appear
      leave-active-class="animated animate__slideOutLeft"
      enter-active-class="animated animate__slideInRight">
      <page-login class="page" v-if="ui.page === 'login'"/>
      <page-session class="page" v-if="ui.page === 'session'"/>
      <page-accueil class="page" v-if="ui.page === 'accueil'"/>
      <page-compte class="page" v-if="ui.page === 'compte'"/>
      <page-sponsorings class="page" v-if="ui.page === 'sponsorings'"/>
      <page-chats class="page" v-if="ui.page === 'chats'"/>
      <page-compta class="page" v-if="ui.page === 'compta'"/>
      <page-tribus class="page" v-if="ui.page === 'tribus'"/>
      <page-tribu class="page" v-if="ui.page === 'tribu'"/>
      <page-people class="page" v-if="ui.page === 'people'"/>
    </transition-group>
  </q-page-container>

  <q-dialog v-model="ui.aunmessage" seamless position="bottom">
    <div :class="'q-pa-sm cursor-pointer ' + (ui.message.important ? 'msgimp' : 'text-white bg-grey-9')"  
      @click="ui.effacermessage">
      {{ ui.message.texte }}
    </div>
  </q-dialog>

  <q-dialog v-model="ui.dialoguedrc">
    <q-card  class="q-ma-xs petitelargeur">
      <q-card-section>
        <div class="titre-lg">{{$t('MLAdrc')}}</div>
      </q-card-section>
      <q-card-actions vertical align="center">
        <q-btn class="w15" dense size="md" color="warning"
          icon="logout" :label="$t('MLAdecon')" @click="deconnexion" v-close-popup/>
        <q-btn class="q-ma-xs w15" dense size="md" color="warning"
          icon="logout" :label="$t('MLArecon')" @click="reconnexion" v-close-popup/>
        <q-btn class="q-ma-xs w15" dense size="md" color="primary"
          :label="$t('MLAcont')" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-if="ui.dialogueerreur" v-model="ui.dialogueerreur" persistent>
    <dialogue-erreur/>
  </q-dialog>

  <q-dialog v-if="ui.dialoguehelp" v-model="ui.dialoguehelp" full-height position="left">
    <dialogue-help/>
  </q-dialog>

  <q-dialog v-if="outilsTests" v-model="outilsTests" full-height persistent>
    <outils-tests :close="closeOutils"/>
  </q-dialog>

  <q-dialog v-model="ui.detailspeople" full-height persistent>
    <panel-people :id="ui.peopleId" :close="closepp"/>
  </q-dialog>

  <q-dialog v-model="ui.detailsavatar" full-height persistent>
    <q-layout container view="hHh lpR fFf" :class="dkli(0)" style="width:80vw">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="closeav"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtitav', [session.avC.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-card style="min-height:50vh" class="q-pa-sm largeur40">
          <apercu-avatar edit :na="session.avC.na"/>
        </q-card>
      </q-page-container>
    </q-layout>
  </q-dialog>


  <q-dialog v-model="session.opDialog" seamless position="top" full-width persistent transition-show="scale" transition-hide="scale">
    <div class="q-mt-sm column items-center">
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <div v-if="session.opSpinner >= 2" 
          class="spinlargeur height-4 row items-center justify-between no-wrap text-black bg-amber-2 q-pa-sm"
          style="margin:0 auto; overflow:hidden;">
          <div class="col column items-center">
            <div class="text-bold">{{$t('MLAbrk')}}</div>
            <div class="text-bold">{{session.opEncours.nom}}</div>
          </div>
          <div class="col-auto q-mt-sm cursor-pointer column items-center" style="position:relative" @click="cfstop()">
            <q-spinner color="primary" size="3rem" :thickness="4"/>
            <q-badge color="negative" class="text-white stopbtn">{{session.opSpinner}}</q-badge>
          </div>
        </div>
      </transition>
    </div>
  </q-dialog>

  <q-dialog v-model="confirmstopop">
    <q-card>
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('MLAcf', [session.opEncours ? session.opEncours.nom : '???'])}}</q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="$t('MLAcf3')" color="warning" v-close-popup/>
        <q-btn flat :label="$t('MLAcf4')" color="primary" v-close-popup  @click="stopop"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</q-layout>
</template>

<script>
import { useQuasar } from 'quasar'
import { ref } from 'vue'

import stores from './stores/stores.mjs'

import { $t, hms } from './app/util.mjs'
import { reconnexionCompte, deconnexion } from './app/connexion.mjs'

import BoutonHelp from './components/BoutonHelp.vue'
import BoutonLangue from './components/BoutonLangue.vue'
import NotifIco from './components/NotifIco.vue'
import BlocageIco from './components/BlocageIco.vue'

import PageLogin from './pages/PageLogin.vue'
import PageSession from './pages/PageSession.vue'
import PageAccueil from './pages/PageAccueil.vue'
import PageCompte from './pages/PageCompte.vue'
import PageSponsorings from './pages/PageSponserings.vue'
import PageChats from './pages/PageChats.vue'
import PageCompta from './pages/PageCompta.vue'
import PageTribus from './pages/PageTribus.vue'
import PageTribu from './pages/PageTribu.vue'
import PagePeople from './pages/PagePeople.vue'
import PanelPeople from './dialogues/PanelPeople.vue'
import ApercuAvatar from './components/ApercuAvatar.vue'

import FiltreNom from './components/FiltreNom.vue'
import FiltreTxt from './components/FiltreTxt.vue'
import FiltreMc from './components/FiltreMc.vue'
import FiltreNbj from './components/FiltreNbj.vue'
import FiltreAvecbl from './components/FiltreAvecbl.vue'
import FiltreAvecgr from './components/FiltreAvecgr.vue'
import FiltreTribu from './components/FiltreTribu.vue'
import FiltreAvecsp from './components/FiltreAvecsp.vue'
import FiltreTri from './components/FiltreTri.vue'
import FiltreNotif from './components/FiltreNotif.vue'

import OutilsTests from './dialogues/OutilsTests.vue'
import DialogueErreur from './dialogues/DialogueErreur.vue'
import DialogueHelp from './dialogues/DialogueHelp.vue'

export default {
  displayName: 'App',
  name: 'App',

  components: { 
    BoutonHelp, BoutonLangue, OutilsTests, NotifIco, BlocageIco, ApercuAvatar,
    PageLogin, PageSession, PageAccueil, PageCompte, PageSponsorings, PageChats,
    PageCompta, PageTribus, PageTribu, PagePeople, PanelPeople,
    FiltreNom, FiltreTxt, FiltreMc, FiltreNbj, FiltreAvecbl, FiltreTri, FiltreNotif, FiltreAvecsp,
    FiltreAvecgr, FiltreTribu,
    DialogueErreur, DialogueHelp
   },

  computed: {
    tbclass () { return this.$q.dark.isActive ? ' sombre1' : ' clair1' },
    aHome () { return (this.session.status > 1 && this.ui.page !== 'accueil')
      || (!this.session.status && this.ui.page !== 'login') },
    maCompta () { return this.session.compta },
    naMaTribu () { return this.session.compte.nct },
    pc () { return this.session.compta.pc },
    pccl () {return this.pc < 80 ? 'bg-transparent' : (this.pc < 100 ? 'bg-yellow-3' : 'bg-negative') },
  },

  // Transmet au store ui **le franchissement du seuil** etroit / large
  watch: {
    "$q.screen.width"() {
      const et = this.$q.screen.width < this.ui.seuillarge
      if (et !== this.ui.etroite) this.ui.setEtroite(et)
    }
  },

  data () { return {
    hms: hms,
    outilsTests: false,
    confirmstopop: false
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },

    cfstop () {
      this.confirmstopop = true
    },
    stopop () {
      const op = this.session.opEncours
      if (op && op.stop) op.stop()
    },
    ouvrFiltre () { this.ui.menu = true },
    fermFiltre () { this.ui.menu = false },

    tgdark () { this.$q.dark.toggle() },

    closepp () { this.ui.detailspeople = false },
    closeav () { this.ui.detailsavatar = false },
    ouvrirav () { this.ui.detailsavatar = true },

    clickNotif () {
      this.ui.setPage('compta', 'notif')
    },
    pageCompta () { 
      this.ui.setPage('compta', 'compta')
    },
    infoSession () { 
      this.ui.setPage('session')
    },
    gotoAccueilLogin () {
      this.ui.setPage(this.session.status > 1 ? 'accueil' : 'login')
    },
    gotoBack () {
      this.ui.setPageBack()
    },
    
    deconnexion () { deconnexion() },
    async reconnexion () { await reconnexionCompte() },

    closeOutils () { this.outilsTests = false },

    async panelcontactsAut () { if (await this.session.aut(4)) this.ui.panelContacts = true },
    async fichiersavionAut () { if (await this.session.aut(4)) this.ui.fichiersAvion = true },
  },

  setup () {
    const $q = useQuasar()
    $q.dark.set(true)

    const config = stores.config
    config.$q = $q

    /*
    setTimeout(async () => {
      try { await crypter(new Uint8Array(3), 'toto')
      } catch(e) { console.log(e.code); console.log(e.stack) } }, 500)
    */
   
    const ui = stores.ui
    ui.etroite = $q.screen.width < ui.seuillarge

    const session = stores.session
    const avStore = stores.avatar

    console.log($t('build', [config.build, config.debug]))

    const infomode = ref(false)
    const infonet = ref(false)
    const infoidb = ref(false)
    const drc = ref(false)

    /* Gère le **changement de largeur** de la fenêtre selon la page actuellement affichée:
    - si elle **devient** étroite, ferme le drawer de filtre
    - si elle **devient** large, ET que la page a un filtre, ouvre le drawer de filtre
    */
    ui.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setEtroite'){
          const et = ui.etroite
          ui.menu = false
          if (!et && ui.filtre) 
              setTimeout(() => {
                ui.menu = true
              }, 500)
          }
      })
    })

    return {
      session,
      config,
      ui,
      avStore,
      infonet,
      infoidb,
      infomode,
      drc
    }
  }
}
</script>

<style lang="css">
.animate__slideInRight {
  --animate-duration: 0.2s;
}
.animate__slideOutLeft {
  --animate-duration: 0.2s;
}
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
  padding: 0 !important
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
</style>
