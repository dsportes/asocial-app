<template>
  <q-card>
    <div :class="'column q-px-sm ' + dkli(idx)">
      <div class="col-auto items-center q-mr-sm">
        <img class="photomax" :src="photo" />
      </div>
      <div class="col">
        <div>
          <span class="text-bold fs-md q-mr-sm">{{mb.na.nomc}}</span>
          <span class="text-bold fs-sm font-mono q-mr-sm">#{{mb.ids}}</span> 
        </div>
        <show-html v-if="info" class="q-my-xs bord" :idx="idx" zoom maxh="4rem" :texte="info"/>
        <div v-else class="text-italic">{{$t('PGnocv')}}</div>

        <div>
          <span class="fs-md q-mr-md">{{$t('statutmb' + st)}}</span>
          <q-btn dense size="sm" color="primary" icon="settings" :label="$t('PGchanger')"/>
        </div>

        <div class="fs-md">
          <span v-if="m.ids === gSt.grC.imh" class="q-mr-xs">{{$t('PCheb')}}</span>
          <span v-if="m.ids === 1" class="q-mr-xs">{{$t('PCfond')}}</span>
          <span v-if="m.ids === gSt.grC.imh" class="q-mr-xs">{{$t('PCheb')}}</span>
          <span v-if="m.idi && gSt.grC.ast[m.idi]" class="q-mr-xs">
            {{$t('PCct1', [mbidi ? mbidi.na.nomc : '?'])}}</span>
          <span v-if="m.idi && !gSt.grC.ast[m.idi]" class="q-mr-xs">{{$t('PCct2', [m.idi])}}</span>
        </div>

        <div v-if="mb.vote && gSt.grC.stx===2" class="titre-md text-italic">{{$t('PGavote')}}</div>

        <div class="row petite largeur titre-md text-italic">
          <div col="4">{{$t('PGddi')}}</div>
          <div col="4">{{$t('PGdda')}}</div>
          <div col="4">{{$t('PGdfa')}}</div>
        </div>
        <div class="row petite largeur fs-md font-mono">
          <div col="4">{{ddi}}</div>
          <div col="4">{{dda}}</div>
          <div col="4">{{dja}}</div>
        </div>
      </div>
    </div>

    <!-- Dialogue de changement de statut -->
    <q-dialog v-model="edit" persistent>
      <q-card class="petitelargeur shadow-8 column">
        <div class="titre-lg q-my-sm text-center">{{mb.na.nomc}}</div>
        <div class="titre-lg q-my-sm text-center">{{$t('statutmb' + st)}}</div>
        <q-btn v-if="st===10" class="q-my-xs text-center" no-caps dense color="warning" 
          :label="$t('action1')" @click="action=1"/>

        <q-btn v-if="st>=20 && st<=22" class="q-my-xs text-center" no-caps dense color="warning" 
          :label="$t('action2')" @click="action=2"/>
        <q-btn v-if="st>=20 && st<=22" class="q-my-xs text-center" no-caps dense color="warning" 
          :label="$t('action1b')" @click="action=1"/>
        <q-btn v-if="st===21 || st===22" class="q-my-xs text-center" no-caps dense color="primary" 
          :label="$t('action20')" @click="action=20"/>
        <q-btn v-if="st===20 || st===22" class="q-my-xs text-center" no-caps dense color="primary" 
          :label="$t('action21')" @click="action=21"/>
        <q-btn v-if="st===20 || st===21" class="q-my-xs text-center" no-caps dense color="primary" 
          :label="$t('action22')" @click="action=22"/>

        <q-btn v-if="st>=30 && st<=32" class="q-my-xs text-center" no-caps dense color="warning" 
          :label="$t('action3')" @click="action=3"/>
        <q-btn v-if="st>=30 && st<=32" class="q-my-xs text-center" no-caps dense color="warning" 
          :label="$t('action1b')" @click="action=1"/>
        <q-btn v-if="st===31 || st===32" class="q-my-xs text-center" no-caps dense color="primary" 
          :label="$t('action30')" @click="action=30"/>
        <q-btn v-if="st===30 || st===32" class="q-my-xs text-center" no-caps dense color="primary" 
          :label="$t('action31')" @click="action=31"/>
        <q-btn v-if="st===30 || st===31" class="q-my-xs text-center" no-caps dense color="primary" 
          :label="$t('action32')" @click="action=32"/>

        <q-btn v-if="st===40 || st===50" class="q-my-xs text-center" no-caps dense color="warning" 
          :label="$t('action1')" @click="action=1"/>
        <q-btn v-if="st===40 || st===50" class="q-my-xs text-center" no-caps dense color="primary" 
          :label="$t('action40')" @click="action=40"/>
        <q-btn v-if="st===40 || st===50" class="q-my-xs text-center" no-caps dense color="primary" 
          :label="$t('action41')" @click="action=41"/>
        <q-btn v-if="st===40 || st===50" class="q-my-xs text-center" no-caps dense color="primary" 
          :label="$t('action42')" @click="action=42"/>
      </q-card>
      <q-card-actions vertical>
        <q-btn class="q-pa-xs" dense :label="$t('renoncer')" color="warning" icon="close" @click="closeSt"/>
        <bouton-confirm :actif="action!==0" :confirmer="actionSt"/>
      </q-card-actions>
    </q-dialog>
  </q-card>
</template>
<script>
// import { toRef, ref, watch } from 'vue'

import { afficherDiag, dhcool } from 'src/app/util.mjs'
import stores from '../stores/stores.mjs'
import BoutonConfirm from './BoutonConfirm.vue'

export default {
  name: 'ApercuMembrepe',

  props: { mb: Object, idx: Number },

  components: { BoutonConfirm },

  computed: {
    photo () { return this.mb && this.mb.cv && this.mb.cv.photo ? this.mb.cv.photo : this.photoDef },
    info () { return this.mb && this.mb.cv ? this.mb.cv.info || '' : '' },
    st () { return this.gSt.grC.ast[this.mb.ids] },
    ddi () { return this.mb.ddi ? dhcool(this.mb.ddi) : '-' },
    dda () { return this.mb.dda ? dhcool(this.mb.dda) : '-' },
    dfa () { return this.mb.dfa ? dhcool(this.mb.dfa) : '-' },
    mbidi () { return this.gSt.getMembre(this.mb, this.mb.idi)},
  },

  data () { return {
    chgSt: false,
    action: 0
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async changeSt () {
      if (!await this.session.edit()) return
      const an = this.gSt.compteEstAnimC
      if (!an) {
        await afficherDiag(this.$t('PGpasanst1'))
        return
      }
      if (an && this.st === 32) {
        await afficherDiag(this.$t('PGpasanst2'))
        return
      }
      this.action = 0
      this.chgSt = true
    },
    async actionSt () {
      console.log(this.action)
      this.chgSt = false
      this.action = 0
    },
    closeSt () {
      this.chgSt = false
      this.action = 0
    }
  },

  setup (props) {
    const session = stores.session
    const gSt = stores.groupe
    const photoDef = stores.config.iconAvatar
    /*
    const idg = toRef(props, 'idg')
    const im = toRef(props, 'im')
    const session = stores.session
    const gSt = stores.groupe

    function getM () { return gSt.getMembre(idg.value, im.value) }

    const mb = ref(getM())

    gSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setMembre' && args[0].id === idg.value && args[0].ids === im.value) ||
          (name === 'delMembre' && args[0] === idg.value && args[1] === im.value)){
          mb.value = getM()
        }
      })
    })

    // Nécessaire pour tracker le changement d'id
    // Dans une liste le composant N'EST PAS rechargé quand la liste change
    watch(() => idg.value, (ap, av) => {
          mb.value = getM()
      }
    )

    // Nécessaire pour tracker le changement d'id
    // Dans une liste le composant N'EST PAS rechargé quand la liste change
    watch(() => im.value, (ap, av) => {
          mb.value = getM()
      }
    )
    */
    return {
      session,
      gSt,
      photoDef
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 0 !important
  width: 1.5rem !important
</style>
