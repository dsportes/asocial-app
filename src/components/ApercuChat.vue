<template>
  <div>
    <div :class="'column ' + dkli(idx)">
      <div class="row justify-between">
        <div class="fs-md q-mr-sm nom">{{naI.nomc}}</div>
        <div v-if="chat.z" class="text-negative text-bold">{{$t('supprime')}}</div>
        <div v-else class="font-mono">{{dhcool(chat.dh)}}</div>
      </div>
      <apercu-motscles class="full-width" :groupe-id="0" @ok="changeMc"
        :motscles="motscles" :edit="session.auts(3, true)" :src="chat.mc || new Uint8Array(0)"/>
      <div v-if="!chat.z" class="row">
        <show-html class="col q-mr-sm bord" :idx="idx" zoom maxh="3rem" :texte="chat.txt"/>
        <q-btn class="col-auto" size="sm" icon="edit" color="primary" @click="editer"/>
      </div>
    </div>

    <!-- Dialogue d'édition du texte du chat -->
    <q-dialog v-model="chatedit" persistent>
      <q-card class="moyennelargeur shadow-8">
        <q-toolbar class="bg-secondary text-white">
          <q-toolbar-title class="titre-lg full-width">{{$t('CHtxt')}}</q-toolbar-title>
          <q-btn dense flat size="md" icon="close" @click="chatedit=false"/>
        </q-toolbar>
        <editeur-md ref="memoed" class="height-10"
          :texte="chat.txt" editable modetxt :label-ok="$t('OK')" @ok="chatok"/>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>

import { toRef, ref } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import EditeurMd from './EditeurMd.vue'
import { dhcool } from '../app/util.mjs.mjs'
import { Motscles } from '../app/modele.mjs.mjs'

export default {
  name: 'ApercuChat',

  props: { id: Number, ids: Number, idx: Number },
  /* Compilé: { id (avatar), dh, naE, txt } */

  components: { ShowHtml, EditeurMd },

  computed: { },

  data () { return {
    chatedit: false,
    dhcool: dhcool
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async editer () {
      if (await this.session.aut(3, true)) this.chatedit = true
    },
    async chatok (txt) {
      console.log(txt)
    },
    async changeMc (mc) {
      console.log(mc[0])
    }
  },

  setup (props) {
    const session = stores.session
    const avStore = stores.avatar
    const id = toRef(props, 'id')
    const ids = toRef(props, 'ids')
    const naI = getNg(id.value)

    function getC () {
      const c = avStore.getChat(id.value, ids.value)
      return c || { id: naI.id, z: true }
    }

    const chat = ref(getC())
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setChat' && args[0].id === id.value && args[0].ids === ids.value) ||
          (name === 'delChat' && args[0] === id.value && args[1] === ids.value)){
          chat.value = getC()
        }
      })
    })

    const mc = reactive({ categs: new Map(), lcategs: [], st: { enedition: false, modifie: false } })
    const motscles = new Motscles(mc, 1)

    return {
      session,
      naI,
      chat,
      motscles
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
</style>
