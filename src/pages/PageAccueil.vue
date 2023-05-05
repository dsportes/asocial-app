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
      <div class="btn2" @click="ovoutilsTests">
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
          <q-knob v-model="aSt.compta.pc" size="24px" :thickness="1" color="black" track-color="green-9"/>
          <div class="bdg1 text-white bg-transparent text-center text-bold fs-xs font-mono">{{aSt.compta.pc + '%'}}</div>
        </div>
        <span>{{$t('MLAvol')}}</span>
      </div>

      <!-- Notifications -->
      <div class="btn2" @click="clickNotif">
        <notif-icon class="q-ml-xs" :alire="session.alire" :niv="session.niv" :cible="0"/>
        <span class="q-ml-xs">{{$t('MLAntf')}}</span>
      </div>

      <!-- Chats d'urgence -->
      <div class="btn2" @click="clickNotif2">
        <q-btn class="q-mr-xs" dense size="md" icon="chat"/>
        <span class="q-ml-xs">{{$t('MLAchats')}}</span>
      </div>

    </div>

    <q-separator color="orange" class="q-ma-sm"/>

    <div v-if="session.niv === 3" class="q-my-sm q-px-sm titre-md text-bold text-italic text-warning cursor-pointer"
      @click="clickNotif2">{{$t('ACbloc')}}</div>

    <div v-if="session.niv < 3">
      <div v-if="session.estSponsor" 
        class="q-my-sm q-px-sm titre-md text-bold text-italic text-warning">
        {{$t('ACcptspons')}}</div>      
      <page-menu/>
    </div>

    <q-dialog v-model="outilsTests" full-height persistent>
      <outils-tests/>
    </q-dialog>

  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonLangue from '../components/BoutonLangue.vue'
import NotifIcon from '../components/NotifIcon.vue'
import OutilsTests from '../dialogues/OutilsTests.vue'
import PageMenu from '../pages/PageMenu.vue'
import { MD } from '../app/modele.mjs'

export default {
  name: 'PageAccueil',

  components: { PageMenu, BoutonHelp, BoutonLangue, NotifIcon, OutilsTests },

  computed: {
    pccl () {return this.aSt.compta.pc < 80 ? 'bg-transparent' : (this.aSt.compta.pc < 100 ? 'bg-yellow-3' : 'bg-negative') },
  },

  methods: {
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
    }
  },

  setup () {
    const outilsTests = ref(false)
    function ovoutilsTests () { MD.oD(outilsTests) }

    return {
      MD, outilsTests, ovoutilsTests,
      ui: stores.ui,
      session: stores.session,
      aSt: stores.avatar,
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

