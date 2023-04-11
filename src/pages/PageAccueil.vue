<template>
  <div>
    <div class="row q-mx-lg justify-center fs-md">

      <!-- Déconnexion -->
      <div class="btn2" @click="ui.dialoguedrc = true">
        <q-btn v-if="session.ok" dense size="md" color="warning" icon="logout" />
        <span class="q-ml-sm">{{$t('MLAdrc2')}}</span>
      </div>

      <div class="btn2">
        <bouton-help page="page1" :label="$t('aide')"/>
      </div>

      <div class="btn2">
        <bouton-langue :label="$t('langue')"/>
      </div>

      <!-- Dark ou clair -->
      <div class="btn2" @click="tgdark">
        <q-btn dense size="md" icon="contrast"/>
        <span class="q-ml-xs">{{$t('clairfonce')}}</span>
      </div>

      <!-- Outils et tests -->
      <div class="btn2" @click="outilsTests = true">
        <q-btn dense size="md" icon="settings"/>
        <span class="q-ml-xs">{{$t('MLAout')}}</span>
      </div>

      <!-- Information session : mode synchro -->
      <div v-if="session.synchro" class="btn2" @click="infoSession">
        <q-btn class="q-mr-xs" dense size="md" icon="autorenew" color="primary"/>
        <span>{{$t('MLAinfm')}}</span>
      </div>

      <!-- Information session : mode incognito -->
      <div v-if="session.incognito" class="btn2" @click="infoSession">
        <q-avatar class="q-mr-xs" size="sm" square color="primary">
          <img src="~assets/incognito_blanc.svg">
        </q-avatar>
        <span>{{$t('MLAinfm')}}</span>
      </div>

      <!-- Information session : mode avion -->
      <div v-if="session.avion" class="btn2" @click="infoSession">
        <q-btn class="q-mr-xs" dense size="md" icon="airplanemode_active" color="primary"/>
        <span>{{$t('MLAinfm')}}</span>
      </div>

      <!-- Comptabilité des volumes -->
      <div class="btn2 row items-center" @click="pageCompta">
        <div style="position:relative" :class="'q-mr-xs bg2 ' + pccl">
          <q-knob v-model="avStore.compta.pc" size="24px" :thickness="1" color="black" track-color="green-9"/>
          <div class="bdg1 text-white bg-transparent text-center text-bold fs-xs font-mono">{{avStore.compta.pc + '%'}}</div>
        </div>
        <span>{{$t('MLAvol')}}</span>
      </div>

      <!-- Notifications -->
      <div class="btn2" @click="clickNotif">
        <notif-ico class="q-ml-xs" v-if="session.estComptable" clickable :alire="session.alirentf" 
          :gravite="session.gntf === 2" :neutre="session.gntf === 0"/>
        <notif-ico class="q-ml-xs" v-else clickable :alire="session.alirentf" 
          :gravite="session.gntf === 2" :neutre="session.gntf === 0"/>
        <span class="q-ml-xs">{{$t('MLAntf')}}</span>
      </div>

      <!-- Blocages -->
      <div class="btn2" @click="clickNotif">
        <blocage-ico class="q-ml-xs" clickable :niveau="session.nivbl" :alire="session.alirebl"/>
        <span class="q-ml-xs">{{$t('MLAbloc')}}</span>
      </div>

      <!-- Chats d'urgence -->
      <div class="btn2" @click="clickNotif2">
        <q-btn class="q-mr-xs" dense size="md" icon="chat"/>
        <span class="q-ml-xs">{{$t('MLAchats')}}</span>
      </div>

    </div>

    <q-separator color="orange" class="q-ma-sm"/>

    <div v-if="session.nivbl === 3" class="q-my-sm q-px-sm titre-md text-bold text-italic text-warning text-center cursor-pointer"
      @click="clickNotif2">{{$t('ACbloc')}}</div>

    <div v-if="session.nivbl < 3">
      <div v-if="session.estSponsor" 
        class="q-my-sm q-px-sm titre-md text-bold text-italic text-warning text-center">
        {{$t('ACcptspons')}}</div>

      <div class="row items-center q-mx-lg justify-center fs-md">
        <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACmesav')"
          @click="ui.setPage('compte')">
          <q-badge color="teal-10" rounded floating>{{nbtav}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACmesgr')"
          @click="ui.setPage('groupes')">
          <q-badge color="teal-10" rounded floating>{{nbtgr}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACmesctc')"
          @click="ui.setPage('people')">
          <q-badge color="teal-10" rounded floating>{{nbtct}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACmatribu', [avStore.tribu.na.nom])"
          @click="maTribu()"/>
        <q-btn v-if="session.estComptable" class="btn1" dense no-caps color="primary"
          :label="$t('ACtribus')" @click="ui.setPage('tribus')">
          <q-badge color="teal-10" rounded floating>{{nbttr}}</q-badge>
        </q-btn>
        <q-btn class="btn3" dense no-caps color="primary" :label="$t('ACmessecrets')" />
      </div>

      <q-separator color="orange" class="q-my-sm"/>

      <div class="q-my-sm q-px-sm titre-md text-bold text-center">
        <span class="text-italic">{{$t('ACav')}}</span>
        <q-btn class="q-ml-md" dense :label="avStore.avC.na.nomc" no-caps
          icon-right="open_in_new" @click="ui.detailsavatar = true"/>
      </div>

      <div class="row items-center q-mx-lg justify-center fs-md">
        <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACsecrets')">
          <q-badge color="teal-10" rounded floating>{{nbavsecs}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACgroupes')"
          @click="ui.setPage('groupesac')">
          <q-badge color="teal-10" rounded floating>{{nbgrps}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACchats')"
          @click="ui.setPage('chats')">
          <q-badge color="teal-10" rounded floating>{{nbchats}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACsponsorings')"
          @click="ui.setPage('sponsorings')">
          <q-badge color="teal-10" rounded floating>{{nbspons}}</q-badge>
        </q-btn>
      </div>

      <q-separator color="orange" class="q-my-sm"/>

      <div :class="'row items-center q-mx-lg justify-center fs-md' + (!session.groupeId ? ' disabled' : '')">
        <div class="q-my-sm q-px-sm titre-md text-bold text-italic text-center full-width">
          {{session.groupeId ? $t('ACgr', [grStore.grC.na.nomc]) : $t('MLAngr')}}
        </div>
        <q-btn class="btn1" dense no-caps color="warning" :label="$t('ACsecrets')">
          <q-badge color="teal-10" rounded floating>{{nbgrsecs}}</q-badge>
        </q-btn>
        <q-btn class="btn1" dense no-caps color="primary" :label="$t('ACmembres')">
          <q-badge color="teal-10" rounded floating>{{nbmbs}}</q-badge>
        </q-btn>
      </div>

      <q-separator color="orange" class="q-my-sm"/>

      <div :class="'row items-center q-mx-lg justify-center fs-md ' + (!session.accesIdb ? ' disabled' : '')">
        <div v-if="session.incognito" class="titre-md text-italic full-width text-center">{{$t('ACidb')}}</div>
        <q-btn class="btn3" dense no-caps color="primary" :label="$t('ACficav')" />
        <q-btn class="btn3" dense no-caps color="primary" :label="$t('ACtfloc')" />
      </div>
    </div>

    <q-dialog v-if="outilsTests" v-model="outilsTests" full-height persistent>
      <outils-tests :close="closeOutils"/>
    </q-dialog>

  </div>
</template>

<script>
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonLangue from '../components/BoutonLangue.vue'
import NotifIco from '../components/NotifIco.vue'
import BlocageIco from '../components/BlocageIco.vue'
import OutilsTests from '../dialogues/OutilsTests.vue'

export default {
  name: 'PageAccueil',

  components: { BoutonHelp, BoutonLangue, NotifIco, BlocageIco, OutilsTests },

  computed: {
    elt () { return this.avStore.getElt(this.session.avatarId) },
    nbavsecs () { return this.elt.secrets.size },
    nbchats () { return this.elt.chats.size },
    nbspons () { return this.elt.sponsorings.size },
    nbgrps () { return this.elt.avatar.lgr.size },

    nbgrsecs () { return '?' },
    nbmbs () { return '?' },

    nbtav () { return this.avStore.compta.mav.size },
    nbtgr () { return this.grStore.map.size },
    nbtct () { return this.pStore.map.size },
    nbttr () { return this.avStore.nbTribus },
    nbtsp () { return 1 },
    nbtiv () { return 1 },

    pccl () {return this.avStore.compta.pc < 80 ? 'bg-transparent' : (this.avStore.compta.pc < 100 ? 'bg-yellow-3' : 'bg-negative') },
  },

  methods: {
    maTribu () { 
      this.avStore.setTribuC()
      this.ui.setPage('tribu')
    },
        
    tgdark () { this.$q.dark.toggle() },

    closeOutils () { this.outilsTests = false },

    clickNotif () {
      this.ui.setPage('compta', 'notif')
    },

    clickNotif2 () {
      this.ui.setPage('compta', 'chats')
    },

    pageCompta () { 
      this.ui.setPage('compta', 'compta')
    },

    infoSession () { 
      this.ui.setPage('session')
    }
  },

  data () {
    return {
      outilsTests: false
    }
  },

  setup () {
    return {
      ui: stores.ui,
      session: stores.session,
      avStore: stores.avatar,
      pStore: stores.people,
      grStore: stores.groupe
    }
  }

}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn1, .btn3
  width: 9rem
  height: 2rem
  line-height: 0.8rem
  overflow: hidden
  padding: 0.1rem
  margin: 0.2rem
.btn2
  width: 14rem
  height: 2rem
  overflow: hidden
  padding: 0.1rem
  margin: 0.2rem
  border-radius: 5px
  border:  1px solid grey
  cursor: pointer
.btn3
  width: 14rem
.bdg1
  position: absolute
  top: 6px
  width: 24px
</style>

